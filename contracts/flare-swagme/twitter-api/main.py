from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import re
import os
import httpx
import asyncio
from typing import Optional
from bs4 import BeautifulSoup
import json
import random
import time

app = FastAPI(
    title="SwagForm Twitter Verification API",
    description="API for verifying tweet existence for SwagForm proof requirements",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TweetData(BaseModel):
    tweetId: str
    authorUsername: str
    tweetText: str
    createdAt: str
    exists: bool
    timestamp: int

# Twitter/X scraping configuration
TWITTER_BASE_URL = "https://x.com"

# User agents to rotate (to avoid detection)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0"
]

def get_scraping_headers():
    """Get headers for scraping with random user agent"""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0"
    }

def extract_tweet_id(tweet_input: str) -> str:
    """Extract tweet ID from URL or return as-is if already an ID"""
    # Handle Twitter/X URL formats
    url_patterns = [
        r'https?://(?:www\.)?twitter\.com/[^/]+/status/(\d+)',
        r'https?://(?:www\.)?x\.com/[^/]+/status/(\d+)',
    ]
    
    for pattern in url_patterns:
        match = re.search(pattern, tweet_input)
        if match:
            return match.group(1)
    
    # If no URL pattern matched, assume it's already a tweet ID
    if tweet_input.isdigit():
        return tweet_input
    
    raise HTTPException(status_code=400, detail="Invalid tweet URL or ID format")

async def scrape_tweet_from_twitter(tweet_id: str) -> TweetData:
    """Scrape tweet data from Twitter/X webpage"""
    try:
        # Construct the tweet URL - try different approaches
        urls_to_try = [
            # Try direct nitter instances first (better for scraping)
            f"https://nitter.net/i/status/{tweet_id}",
            f"https://nitter.poast.org/i/status/{tweet_id}",
            f"https://nitter.privacydev.net/i/status/{tweet_id}",
            # Try public Twitter embeds (no auth needed)
            f"https://publish.twitter.com/oembed?url=https://twitter.com/i/web/status/{tweet_id}",
            # Try Twitter API URL (sometimes has JSON data)
            f"https://api.twitter.com/1.1/statuses/show/{tweet_id}.json",
            # Try syndication API (public, no auth needed)
            f"https://syndication.twitter.com/srv/timeline-profile/screen-name/twitter?include_entities=true&include_available_features=1&include_entities=1&tweet_id={tweet_id}",
            # Try X/Twitter web URLs
            f"https://x.com/i/web/status/{tweet_id}",
            f"https://twitter.com/i/web/status/{tweet_id}",
            f"https://x.com/twitter/status/{tweet_id}",
        ]
        
        # Also try to guess username from tweet ID by checking common patterns
        # We'll try some common usernames that might have this tweet
        common_usernames = ["twitter", "x", "elonmusk", "jack", "verified"]
        for username in common_usernames:
            urls_to_try.append(f"https://nitter.net/{username}/status/{tweet_id}")
            urls_to_try.append(f"https://x.com/{username}/status/{tweet_id}")
        
        for url in urls_to_try:
            try:
                headers = get_scraping_headers()
                
                # Add small random delay to avoid rate limiting
                await asyncio.sleep(random.uniform(0.5, 2.0))
                
                async with httpx.AsyncClient(
                    timeout=30.0,
                    follow_redirects=True,
                    headers=headers
                ) as client:
                    response = await client.get(url)
                    
                    if response.status_code == 200:
                        # Check if this is a JSON response (from API endpoints)
                        if response.headers.get('content-type', '').startswith('application/json'):
                            try:
                                json_data = response.json()
                                tweet_data = extract_tweet_data_from_json(json_data, tweet_id)
                                if tweet_data and tweet_data.exists and tweet_data.tweetText != "Tweet exists but content could not be extracted":
                                    return tweet_data
                            except json.JSONDecodeError:
                                pass  # Fall back to HTML parsing
                        
                        html_content = response.text
                        
                        # Parse the HTML
                        soup = BeautifulSoup(html_content, 'html.parser')
                        
                        # Try to extract tweet data from various sources
                        tweet_data = extract_tweet_data_from_html(soup, tweet_id, url)
                        
                        if tweet_data and tweet_data.exists and tweet_data.tweetText != "Tweet exists but content could not be extracted":
                            return tweet_data
                        
                    elif response.status_code == 404:
                        # Tweet not found, try next URL
                        continue
                        
                    elif response.status_code == 429:
                        # Rate limited, try next URL
                        continue
                        
            except httpx.RequestError:
                # Try next URL
                continue
        
        # If we reach here, tweet wasn't found on any URL
        return TweetData(
            tweetId=tweet_id,
            authorUsername="unknown",
            tweetText="",
            createdAt="",
            exists=False,
            timestamp=0
        )
                
    except Exception as e:
        # Return as non-existent rather than error to maintain API compatibility
        return TweetData(
            tweetId=tweet_id,
            authorUsername="unknown", 
            tweetText="",
            createdAt="",
            exists=False,
            timestamp=0
        )

def extract_tweet_data_from_json(json_data, tweet_id: str) -> TweetData:
    """Extract tweet data from JSON response"""
    try:
        # Handle different JSON structures
        
        # Twitter API v1.1 format
        if isinstance(json_data, dict):
            if 'id_str' in json_data or 'id' in json_data:
                tweet_text = json_data.get('full_text', json_data.get('text', ''))
                author_username = json_data.get('user', {}).get('screen_name', 'unknown') if isinstance(json_data.get('user'), dict) else "unknown"
                created_at = json_data.get('created_at', '')
                
                if tweet_text:
                    return TweetData(
                        tweetId=tweet_id,
                        authorUsername=author_username,
                        tweetText=tweet_text,
                        createdAt=created_at,
                        exists=True,
                        timestamp=int(time.time())
                    )
            
            # Twitter oEmbed format
            if 'html' in json_data and 'author_name' in json_data:
                # Parse HTML from oEmbed response
                from bs4 import BeautifulSoup
                embed_soup = BeautifulSoup(json_data['html'], 'html.parser')
                
                # Extract text from the embed
                tweet_text = embed_soup.get_text(strip=True)
                # Remove common oEmbed artifacts
                tweet_text = re.sub(r'https?://\S+', '', tweet_text)  # Remove URLs
                tweet_text = re.sub(r'—\s*\w+\s*\(@\w+\).*', '', tweet_text)  # Remove author line
                tweet_text = tweet_text.strip()
                
                if tweet_text and len(tweet_text) > 5:
                    author_username = json_data.get('author_name', 'unknown')
                    # Extract username from author_name if it contains @
                    if '@' in author_username:
                        author_username = author_username.split('@')[1].split(')')[0]
                    
                    return TweetData(
                        tweetId=tweet_id,
                        authorUsername=author_username,
                        tweetText=tweet_text,
                        createdAt="",
                        exists=True,
                        timestamp=int(time.time())
                    )
            
            # Twitter syndication API format
            if 'timeline' in json_data:
                timeline = json_data['timeline']
                if isinstance(timeline, dict) and 'instructions' in timeline:
                    for instruction in timeline['instructions']:
                        if isinstance(instruction, dict) and 'addEntries' in instruction:
                            entries = instruction['addEntries'].get('entries', [])
                            for entry in entries:
                                if isinstance(entry, dict) and 'content' in entry:
                                    content = entry['content']
                                    if isinstance(content, dict) and 'item' in content:
                                        item = content['item']
                                        if isinstance(item, dict) and 'content' in item:
                                            tweet_data = item['content']
                                            if isinstance(tweet_data, dict) and 'tweet' in tweet_data:
                                                tweet = tweet_data['tweet']
                                                if str(tweet.get('id')) == tweet_id:
                                                    legacy = tweet.get('legacy', {})
                                                    if isinstance(legacy, dict):
                                                        tweet_text = legacy.get('full_text', legacy.get('text', ''))
                                                        if tweet_text:
                                                            user_data = tweet.get('core', {}).get('user_results', {}).get('result', {}).get('legacy', {})
                                                            username = user_data.get('screen_name', 'unknown')
                                                            
                                                            return TweetData(
                                                                tweetId=tweet_id,
                                                                authorUsername=username,
                                                                tweetText=tweet_text,
                                                                createdAt=legacy.get('created_at', ''),
                                                                exists=True,
                                                                timestamp=int(time.time())
                                                            )
        
        # If we can't parse it as expected, return not found
        return TweetData(
            tweetId=tweet_id,
            authorUsername="unknown",
            tweetText="",
            createdAt="",
            exists=False,
            timestamp=0
        )
        
    except Exception as e:
        return TweetData(
            tweetId=tweet_id,
            authorUsername="unknown",
            tweetText="",
            createdAt="",
            exists=False,
            timestamp=0
        )

def extract_tweet_data_from_nitter(soup: BeautifulSoup, tweet_id: str, url: str) -> TweetData:
    """Extract tweet data specifically from Nitter pages"""
    try:
        # Find the main tweet container
        tweet_containers = soup.select('.main-tweet, .timeline-tweet')
        
        for container in tweet_containers:
            # Get tweet content
            tweet_content = container.select_one('.tweet-content')
            if tweet_content:
                tweet_text = tweet_content.get_text(strip=True)
                
                # Get username
                username_elem = container.select_one('.username')
                if not username_elem:
                    username_elem = container.select_one('.fullname')
                username = username_elem.get_text(strip=True).replace('@', '') if username_elem else "unknown"
                
                # Get timestamp
                time_elem = container.select_one('.tweet-date a')
                created_at = time_elem.get('title', '') if time_elem else ""
                
                if tweet_text and len(tweet_text) > 5:
                    return TweetData(
                        tweetId=tweet_id,
                        authorUsername=username,
                        tweetText=tweet_text,
                        createdAt=created_at,
                        exists=True,
                        timestamp=int(time.time())
                    )
        
        # If no tweet found but page loaded, try alternate selectors
        tweet_text_alt = soup.select_one('.tweet-text, .quote-text')
        if tweet_text_alt:
            tweet_text = tweet_text_alt.get_text(strip=True)
            if tweet_text and len(tweet_text) > 5:
                # Try to find username
                username_elem = soup.select_one('.username, .fullname')
                username = username_elem.get_text(strip=True).replace('@', '') if username_elem else "unknown"
                
                return TweetData(
                    tweetId=tweet_id,
                    authorUsername=username,
                    tweetText=tweet_text,
                    createdAt="",
                    exists=True,
                    timestamp=int(time.time())
                )
        
        # If still no content but page seems to be a tweet page
        if 'status' in url or tweet_id in str(soup):
            return TweetData(
                tweetId=tweet_id,
                authorUsername="unknown",
                tweetText="Tweet exists but content could not be extracted",
                createdAt="",
                exists=True,
                timestamp=int(time.time())
            )
        
        # Tweet not found
        return TweetData(
            tweetId=tweet_id,
            authorUsername="unknown",
            tweetText="",
            createdAt="",
            exists=False,
            timestamp=0
        )
        
    except Exception as e:
        return TweetData(
            tweetId=tweet_id,
            authorUsername="unknown",
            tweetText="",
            createdAt="",
            exists=False,
            timestamp=0
        )

def extract_tweet_data_from_html(soup: BeautifulSoup, tweet_id: str, url: str) -> TweetData:
    """Extract tweet data from parsed HTML"""
    try:
        # Special handling for Nitter instances
        if 'nitter' in url:
            return extract_tweet_data_from_nitter(soup, tweet_id, url)
        # Method 1: Try to find JSON-LD structured data
        json_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and 'text' in data:
                    author_username = data.get('author', {}).get('url', '').split('/')[-1] if data.get('author') else "unknown"
                    
                    return TweetData(
                        tweetId=tweet_id,
                        authorUsername=author_username,
                        tweetText=data.get('text', ''),
                        createdAt=data.get('datePublished', ''),
                        exists=True,
                        timestamp=int(time.time())
                    )
            except (json.JSONDecodeError, KeyError):
                continue
        
        # Method 1.5: Try to find any JSON data in script tags
        all_scripts = soup.find_all('script')
        for script in all_scripts:
            if script.string:
                try:
                    # Look for JSON that might contain tweet data
                    text = script.string
                    if tweet_id in text and ('tweet' in text.lower() or 'text' in text.lower()):
                        # Try to parse as JSON
                        if text.strip().startswith('{') or text.strip().startswith('['):
                            try:
                                data = json.loads(text)
                                # Recursively search for tweet data
                                def find_tweet_data(obj, path=""):
                                    if isinstance(obj, dict):
                                        if 'full_text' in obj or 'text' in obj:
                                            tweet_text = obj.get('full_text', obj.get('text', ''))
                                            if tweet_text and len(tweet_text) > 10:
                                                username = obj.get('user', {}).get('screen_name', 'unknown') if isinstance(obj.get('user'), dict) else "unknown"
                                                return TweetData(
                                                    tweetId=tweet_id,
                                                    authorUsername=username,
                                                    tweetText=tweet_text,
                                                    createdAt=obj.get('created_at', ''),
                                                    exists=True,
                                                    timestamp=int(time.time())
                                                )
                                        # Recurse into nested objects
                                        for key, value in obj.items():
                                            result = find_tweet_data(value, f"{path}.{key}")
                                            if result:
                                                return result
                                    elif isinstance(obj, list):
                                        for i, item in enumerate(obj):
                                            result = find_tweet_data(item, f"{path}[{i}]")
                                            if result:
                                                return result
                                    return None
                                
                                result = find_tweet_data(data)
                                if result:
                                    return result
                            except json.JSONDecodeError:
                                pass
                except Exception:
                    continue
        
        # Method 2: Try to find Open Graph meta tags
        og_title = soup.find('meta', property='og:title')
        og_description = soup.find('meta', property='og:description')
        og_url = soup.find('meta', property='og:url')
        
        if og_description and og_description.get('content'):
            # Try to extract username from URL
            author_username = "unknown"
            if og_url and og_url.get('content'):
                url_parts = og_url.get('content').split('/')
                if len(url_parts) >= 4:
                    author_username = url_parts[3]  # Usually x.com/username/status/id
            
            # Also try from original URL
            if author_username == "unknown":
                try:
                    url_parts = url.split('/')
                    if len(url_parts) >= 4 and url_parts[3] not in ['i', 'twitter']:
                        author_username = url_parts[3]
                except:
                    pass
            
            return TweetData(
                tweetId=tweet_id,
                authorUsername=author_username,
                tweetText=og_description.get('content', ''),
                createdAt="",
                exists=True,
                timestamp=int(time.time())
            )
        
        # Method 3: Look for Twitter meta tags
        twitter_title = soup.find('meta', attrs={'name': 'twitter:title'})
        twitter_description = soup.find('meta', attrs={'name': 'twitter:description'})
        
        if twitter_description and twitter_description.get('content'):
            # Try to extract username from URL
            author_username = "unknown"
            try:
                url_parts = url.split('/')
                if len(url_parts) >= 4 and url_parts[3] not in ['i', 'twitter']:
                    author_username = url_parts[3]
            except:
                pass
            
            return TweetData(
                tweetId=tweet_id,
                authorUsername=author_username,
                tweetText=twitter_description.get('content', ''),
                createdAt="",
                exists=True,
                timestamp=int(time.time())
            )
        
        # Method 4: Look for specific tweet content in title
        title_tag = soup.find('title')
        if title_tag and title_tag.string:
            title_text = title_tag.string
            
            # Pattern 1: "Username on X: 'Tweet text'"
            if ' on X:' in title_text or ' on Twitter:' in title_text:
                parts = title_text.split(' on ')
                if len(parts) >= 2:
                    username = parts[0].strip()
                    # Extract tweet text (usually in quotes)
                    tweet_part = parts[1]
                    if '"' in tweet_part:
                        tweet_text = tweet_part.split('"')[1] if tweet_part.count('"') >= 2 else ""
                    else:
                        tweet_text = tweet_part.split("'")[1] if "'" in tweet_part and tweet_part.count("'") >= 2 else ""
                    
                    if tweet_text:
                        return TweetData(
                            tweetId=tweet_id,
                            authorUsername=username,
                            tweetText=tweet_text,
                            createdAt="",
                            exists=True,
                            timestamp=int(time.time())
                        )
            
            # Pattern 2: "Tweet text / X" (newer X format)
            if ' / X' in title_text:
                tweet_text = title_text.replace(' / X', '').strip()
                if tweet_text:
                    # Try to get username from URL
                    author_username = "unknown"
                    try:
                        url_parts = url.split('/')
                        if len(url_parts) >= 4 and url_parts[3] not in ['i', 'twitter']:
                            author_username = url_parts[3]
                    except:
                        pass
                    
                    return TweetData(
                        tweetId=tweet_id,
                        authorUsername=author_username,
                        tweetText=tweet_text,
                        createdAt="",
                        exists=True,
                        timestamp=int(time.time())
                    )
        
        # Method 5: Look for article content or specific CSS selectors
        # Try common tweet content selectors (including Nitter-specific ones)
        tweet_text_selectors = [
            # Nitter selectors (more reliable)
            '.tweet-content',
            '.quote-text',
            '.tweet-text',
            '.timeline-tweet .tweet-content',
            '.main-tweet .tweet-content',
            # Twitter/X selectors  
            '[data-testid="tweetText"]',
            '[data-testid="tweet-text"]',
            '.TweetTextSize',
            '.tweet-body',
            'p[lang]',  # Twitter often uses lang attribute
            # Generic selectors
            'article p',
            '.status-content',
            '.tweet-body p',
        ]
        
        for selector in tweet_text_selectors:
            elements = soup.select(selector)
            if elements:
                tweet_text = elements[0].get_text(strip=True)
                if tweet_text and len(tweet_text) > 5:  # Filter out very short text
                    # Try to get username from URL
                    author_username = "unknown"
                    try:
                        url_parts = url.split('/')
                        if len(url_parts) >= 4 and url_parts[3] not in ['i', 'twitter']:
                            author_username = url_parts[3]
                    except:
                        pass
                    
                    return TweetData(
                        tweetId=tweet_id,
                        authorUsername=author_username,
                        tweetText=tweet_text,
                        createdAt="",
                        exists=True,
                        timestamp=int(time.time())
                    )
        
        # Method 6: Try to find username from various sources
        def find_username_from_page(soup_obj, url_str):
            """Try to find username from various page elements"""
            username = "unknown"
            
            # Try from URL first
            try:
                url_parts = url_str.split('/')
                if len(url_parts) >= 4 and url_parts[3] not in ['i', 'twitter', 'web']:
                    username = url_parts[3]
                    if username != "unknown":
                        return username
            except:
                pass
            
            # Try from meta tags
            username_selectors = [
                'meta[name="twitter:site"]',
                'meta[name="twitter:creator"]',
                'meta[property="twitter:site"]',
                'meta[property="twitter:creator"]',
                'meta[name="author"]',
            ]
            
            for selector in username_selectors:
                meta_tag = soup_obj.select_one(selector)
                if meta_tag and meta_tag.get('content'):
                    content = meta_tag.get('content').strip()
                    if content.startswith('@'):
                        return content[1:]  # Remove @ symbol
                    elif content and not any(skip in content.lower() for skip in ['twitter', 'x.com']):
                        return content
            
            # Try from title patterns
            title_tag = soup_obj.find('title')
            if title_tag and title_tag.string:
                title = title_tag.string
                # Pattern: "(@username) on X" or "username on X"
                if ' on X' in title or ' on Twitter' in title:
                    parts = title.split(' on ')[0].strip()
                    if parts.startswith('(') and parts.endswith(')'):
                        parts = parts[1:-1]
                    if parts.startswith('@'):
                        return parts[1:]
                    elif parts and not any(skip in parts.lower() for skip in ['post', 'tweet', 'x', 'twitter']):
                        return parts
            
            return username
        
        # Method 7: Try to find any text content that looks like a tweet
        all_text = soup.get_text()
        if tweet_id in all_text:
            # If we can find the tweet ID in the page, it likely exists
            # Try to extract meaningful text around it
            lines = all_text.split('\n')
            for i, line in enumerate(lines):
                line_clean = line.strip()
                if len(line_clean) > 20 and len(line_clean) < 500:  # Tweet-like length
                    # Skip common non-tweet content
                    skip_words = ['cookie', 'privacy', 'terms', 'sign in', 'log in', 'follow', 'retweet', 'like', 'share', 'reply', 'quote', 'bookmark']
                    if not any(skip in line_clean.lower() for skip in skip_words):
                        # This could be tweet content
                        author_username = find_username_from_page(soup, url)
                        
                        return TweetData(
                            tweetId=tweet_id,
                            authorUsername=author_username,
                            tweetText=line_clean,
                            createdAt="",
                            exists=True,
                            timestamp=int(time.time())
                        )
        
        # Method 8: Try to find tweet content by searching for patterns
        page_text = str(soup)
        if tweet_id in page_text:
            # Look for common Twitter text patterns
            import re
            
            # Pattern for tweets in HTML (looking for quoted text)
            tweet_patterns = [
                r'"([^"]{20,280})"',  # Quoted text 20-280 chars
                r"'([^']{20,280})'",  # Single quoted text
                r'>([^<]{20,280})<',  # Text between tags
            ]
            
            for pattern in tweet_patterns:
                matches = re.findall(pattern, page_text)
                for match in matches:
                    # Filter out common non-tweet content
                    if not any(skip in match.lower() for skip in ['cookie', 'privacy', 'terms', 'sign', 'follow', 'http', 'www']):
                        # This might be tweet content
                        username = find_username_from_page(soup, url)
                        if len(match.strip()) > 15:  # Reasonable tweet length
                            return TweetData(
                                tweetId=tweet_id,
                                authorUsername=username,
                                tweetText=match.strip(),
                                createdAt="",
                                exists=True,
                                timestamp=int(time.time())
                            )
        
        # Method 9: Simple existence check - if we have basic meta tags, tweet likely exists
        if soup.find('meta', property='og:type', content='article') or \
           soup.find('meta', attrs={'name': 'twitter:card'}) or \
           'twitter.com' in str(soup) or 'x.com' in str(soup):
            return TweetData(
                tweetId=tweet_id,
                authorUsername="unknown",
                tweetText="Tweet exists but content could not be extracted",
                createdAt="",
                exists=True,
                timestamp=int(time.time())
            )
        
        # If none of the methods work, assume tweet doesn't exist
        return TweetData(
            tweetId=tweet_id,
            authorUsername="unknown",
            tweetText="",
            createdAt="",
            exists=False,
            timestamp=0
        )
        
    except Exception as e:
        # On any error, return as non-existent
        return TweetData(
            tweetId=tweet_id,
            authorUsername="unknown",
            tweetText="",
            createdAt="",
            exists=False,
            timestamp=0
        )

@app.get("/")
async def root():
    return {
        "message": "SwagForm Twitter Verification API",
        "version": "1.0.0",
        "description": "API for verifying tweet existence using Flare Data Connector"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/v1/tweets/{tweet_id}", response_model=TweetData)
async def get_tweet(tweet_id: str):
    """Get tweet data by ID - compatible with FDC Web2Json"""
    
    # Extract tweet ID from URL if provided
    try:
        clean_tweet_id = extract_tweet_id(tweet_id)
    except HTTPException:
        raise HTTPException(status_code=400, detail="Invalid tweet ID format")
    
    # Scrape tweet data from Twitter/X
    return await scrape_tweet_from_twitter(clean_tweet_id)

@app.get("/api/v1/verify-tweet")
async def verify_tweet(url: str):
    """Verify tweet existence by URL - user-friendly endpoint"""
    
    try:
        tweet_id = extract_tweet_id(url)
        tweet_data = await get_tweet(tweet_id)
        
        return {
            "verified": tweet_data.exists,
            "tweet_id": tweet_id,
            "data": tweet_data if tweet_data.exists else None,
            "message": "Tweet verified successfully" if tweet_data.exists else "Tweet not found"
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.get("/api/v1/status")
async def api_status():
    """Check API status and scraping configuration"""
    
    return {
        "status": "healthy", 
        "verification_method": "web_scraping",
        "twitter_base_url": TWITTER_BASE_URL,
        "user_agents_count": len(USER_AGENTS),
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/v1/scraping/test")
async def test_scraping():
    """Test Twitter/X scraping with a known tweet"""
    try:
        # Test with Jack Dorsey's first tweet (ID: 20) - a stable, well-known tweet
        test_tweet_id = "20"
        headers = get_scraping_headers()
        
        # Test scraping
        test_result = await scrape_tweet_from_twitter(test_tweet_id)
        
        return {
            "scraping_status": "working" if test_result.exists else "limited",
            "test_tweet_id": test_tweet_id,
            "test_result": {
                "exists": test_result.exists,
                "author": test_result.authorUsername,
                "has_text": bool(test_result.tweetText),
                "text_preview": test_result.tweetText[:50] + "..." if len(test_result.tweetText) > 50 else test_result.tweetText
            },
            "user_agent": headers.get("User-Agent", "unknown"),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "scraping_status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/v1/scraping/debug/{tweet_id}")
async def debug_scraping(tweet_id: str):
    """Debug endpoint to see what URLs are being tried and what content is found"""
    try:
        debug_info = {
            "tweet_id": tweet_id,
            "urls_tried": [],
            "final_result": None,
            "timestamp": datetime.now().isoformat()
        }
        
        # Construct URLs to try (use same as main function)
        urls_to_try = [
            # Try direct nitter instances first (better for scraping)
            f"https://nitter.net/i/status/{tweet_id}",
            f"https://nitter.poast.org/i/status/{tweet_id}",
            f"https://nitter.privacydev.net/i/status/{tweet_id}",
            # Try public Twitter embeds (no auth needed)
            f"https://publish.twitter.com/oembed?url=https://twitter.com/i/web/status/{tweet_id}",
            # Try Twitter API URL (sometimes has JSON data)
            f"https://api.twitter.com/1.1/statuses/show/{tweet_id}.json",
            # Try X/Twitter web URLs
            f"https://x.com/i/web/status/{tweet_id}",
            f"https://twitter.com/i/web/status/{tweet_id}",
            f"https://x.com/twitter/status/{tweet_id}",
        ]
        
        # Try each URL and log what we find
        for url in urls_to_try:
            try:
                headers = get_scraping_headers()
                await asyncio.sleep(0.5)  # Small delay
                
                url_info = {
                    "url": url,
                    "status_code": None,
                    "title": None,
                    "og_description": None,
                    "twitter_description": None,
                    "has_tweet_content": False,
                    "error": None
                }
                
                async with httpx.AsyncClient(
                    timeout=15.0,
                    follow_redirects=True,
                    headers=headers
                ) as client:
                    response = await client.get(url)
                    url_info["status_code"] = response.status_code
                    
                    if response.status_code == 200:
                        # Check if JSON response
                        if response.headers.get('content-type', '').startswith('application/json'):
                            try:
                                json_data = response.json()
                                url_info["is_json"] = True
                                url_info["json_keys"] = list(json_data.keys()) if isinstance(json_data, dict) else []
                                
                                # Check for tweet content in JSON
                                if isinstance(json_data, dict):
                                    if 'text' in json_data or 'full_text' in json_data:
                                        url_info["has_tweet_text_in_json"] = True
                                    if 'html' in json_data and 'author_name' in json_data:
                                        url_info["is_oembed"] = True
                                        
                            except:
                                url_info["json_parse_error"] = True
                        else:
                            soup = BeautifulSoup(response.text, 'html.parser')
                            
                            # Extract basic info
                            title_tag = soup.find('title')
                            if title_tag:
                                url_info["title"] = title_tag.string
                            
                            og_desc = soup.find('meta', property='og:description')
                            if og_desc:
                                url_info["og_description"] = og_desc.get('content', '')
                            
                            twitter_desc = soup.find('meta', attrs={'name': 'twitter:description'})
                            if twitter_desc:
                                url_info["twitter_description"] = twitter_desc.get('content', '')
                            
                            # Check for tweet content
                            tweet_selectors = [
                                '[data-testid="tweetText"]',
                                '[data-testid="tweet-text"]',
                                '.tweet-content',
                                '.tweet-text',
                                '.TweetTextSize'
                            ]
                            
                            for selector in tweet_selectors:
                                elements = soup.select(selector)
                                if elements:
                                    url_info["has_tweet_content"] = True
                                    url_info["tweet_selector_found"] = selector
                                    url_info["tweet_text_preview"] = elements[0].get_text(strip=True)[:100]
                                    break
                            
                            # Check if tweet ID appears in content
                            if tweet_id in response.text:
                                url_info["tweet_id_found_in_content"] = True
                            
                debug_info["urls_tried"].append(url_info)
                
            except Exception as e:
                url_info["error"] = str(e)
                debug_info["urls_tried"].append(url_info)
        
        # Also run the actual scraping function
        debug_info["final_result"] = await scrape_tweet_from_twitter(tweet_id)
        
        return debug_info
        
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 