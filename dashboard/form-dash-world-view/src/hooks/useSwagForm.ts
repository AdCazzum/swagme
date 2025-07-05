import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';

const CONTRACT_ADDRESS = '0xf46514915183BC22DF0Ae0f0AC264E2534d89404';

const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "formId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "questionsCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "FormCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "formId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "name": "FormStatusChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "formId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "FormSubmitted",
    "type": "event"
  },
  {
    "type": "function",
    "name": "areAllProofsVerified",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" },
      { "name": "_user",   "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createForm",
    "inputs": [
      { "name": "_title",         "type": "string",   "internalType": "string"   },
      { "name": "_description",   "type": "string",   "internalType": "string"   },
      { "name": "_questions",     "type": "string[]", "internalType": "string[]" },
      { "name": "_isRequired",    "type": "bool[]",   "internalType": "bool[]"   },
      { "name": "_requiresProof", "type": "bool[]",   "internalType": "bool[]"   }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "emailExists",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" },
      { "name": "", "type": "string",  "internalType": "string"  }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "formSubmitters",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" },
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "forms",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "title",            "type": "string",  "internalType": "string"  },
      { "name": "description",      "type": "string",  "internalType": "string"  },
      { "name": "isActive",         "type": "bool",    "internalType": "bool"    },
      { "name": "totalSubmissions", "type": "uint256", "internalType": "uint256" },
      { "name": "createdAt",        "type": "uint256", "internalType": "uint256" },
      { "name": "creator",          "type": "address", "internalType": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllFormSubmissions",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct SwagForm.Submission[]",
        "components": [
          { "name": "formId",    "type": "uint256",   "internalType": "uint256"   },
          { "name": "username",  "type": "string",    "internalType": "string"    },
          { "name": "email",     "type": "string",    "internalType": "string"    },
          { "name": "answers",   "type": "string[]",  "internalType": "string[]"  },
          { "name": "timestamp", "type": "uint256",   "internalType": "uint256"   },
          { "name": "submitter", "type": "address",   "internalType": "address"   }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllForms",
    "inputs": [],
    "outputs": [
      { "name": "titles",           "type": "string[]",  "internalType": "string[]"  },
      { "name": "activeStatus",     "type": "bool[]",    "internalType": "bool[]"    },
      { "name": "submissionCounts", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "creators",         "type": "address[]", "internalType": "address[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getForm",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "title",            "type": "string",  "internalType": "string"  },
      { "name": "description",      "type": "string",  "internalType": "string"  },
      { "name": "questionsCount",   "type": "uint256", "internalType": "uint256" },
      { "name": "isActive",         "type": "bool",    "internalType": "bool"    },
      { "name": "submissionsCount", "type": "uint256", "internalType": "uint256" },
      { "name": "createdAt",        "type": "uint256", "internalType": "uint256" },
      { "name": "creator",          "type": "address", "internalType": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFormQuestions",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct SwagForm.Question[]",
        "components": [
          { "name": "questionText", "type": "string", "internalType": "string" },
          { "name": "isRequired",   "type": "bool",   "internalType": "bool"   },
          { "name": "requiresProof","type": "bool",   "internalType": "bool"   }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFormSubmitters",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "address[]", "internalType": "address[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProofRequirements",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "bool[]", "internalType": "bool[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getStats",
    "inputs": [],
    "outputs": [
      { "name": "totalFormsCount",      "type": "uint256", "internalType": "uint256" },
      { "name": "totalSubmissionsCount","type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSubmission",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" },
      { "name": "_user",   "type": "address", "internalType": "address" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct SwagForm.Submission",
        "components": [
          { "name": "formId",    "type": "uint256",  "internalType": "uint256" },
          { "name": "username",  "type": "string",   "internalType": "string"  },
          { "name": "email",     "type": "string",   "internalType": "string"  },
          { "name": "answers",   "type": "string[]", "internalType": "string[]"},
          { "name": "timestamp", "type": "uint256",  "internalType": "uint256" },
          { "name": "submitter", "type": "address",  "internalType": "address" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserForms",
    "inputs": [
      { "name": "_user", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256[]", "internalType": "uint256[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserStats",
    "inputs": [
      { "name": "_user", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "formsCreated",   "type": "uint256", "internalType": "uint256" },
      { "name": "formsSubmitted", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasSubmitted",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" },
      { "name": "_user",   "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isFormCreator",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" },
      { "name": "_user",   "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isProofVerified",
    "inputs": [
      { "name": "_formId",       "type": "uint256", "internalType": "uint256" },
      { "name": "_user",         "type": "address", "internalType": "address" },
      { "name": "_questionIndex","type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proofVerified",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" },
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setFormActive",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" },
      { "name": "_active", "type": "bool",    "internalType": "bool"    }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setProofVerified",
    "inputs": [
      { "name": "_formId",       "type": "uint256", "internalType": "uint256" },
      { "name": "_user",         "type": "address", "internalType": "address" },
      { "name": "_questionIndex","type": "uint256", "internalType": "uint256" },
      { "name": "_verified",     "type": "bool",    "internalType": "bool"    }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "submissions",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" },
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "formId",    "type": "uint256", "internalType": "uint256" },
      { "name": "username",  "type": "string",  "internalType": "string"  },
      { "name": "email",     "type": "string",  "internalType": "string"  },
      { "name": "timestamp", "type": "uint256", "internalType": "uint256" },
      { "name": "submitter", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "submitForm",
    "inputs": [
      { "name": "_formId",  "type": "uint256",   "internalType": "uint256"   },
      { "name": "_username","type": "string",    "internalType": "string"    },
      { "name": "_email",   "type": "string",    "internalType": "string"    },
      { "name": "_answers", "type": "string[]",  "internalType": "string[]"  }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalForms",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSubmissions",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "updateFormDescription",
    "inputs": [
      { "name": "_formId",     "type": "uint256", "internalType": "uint256" },
      { "name": "_description","type": "string",  "internalType": "string"  }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateFormTitle",
    "inputs": [
      { "name": "_formId", "type": "uint256", "internalType": "uint256" },
      { "name": "_title",  "type": "string",  "internalType": "string"  }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "userForms",
    "inputs": [
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  }
];

export interface Question {
  questionText: string;
  isRequired: boolean;
  requiresProof: boolean;
}

export interface FormData {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  isActive: boolean;
  totalSubmissions: number;
  createdAt: number;
  creator: string;
}

export interface Submission {
  formId: number;
  username: string;
  email: string;
  answers: string[];
  timestamp: number;
  submitter: string;
}

export const useSwagForm = () => {
  const { signer, provider, account, isConnected } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (signer && CONTRACT_ADDRESS) {
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);
      console.log('Contract instance created:', CONTRACT_ADDRESS);
      
      // Debug network info
      signer.provider.getNetwork().then(network => {
        console.log('Current network:', network);
        console.log('Chain ID:', network.chainId);
        console.log('Network name:', network.name);
      }).catch(err => {
        console.error('Error getting network:', err);
      });
      
      // Test contract connection
      contractInstance.totalForms().then(totalForms => {
        console.log('Contract connection test - totalForms:', totalForms.toString());
        console.log('Contract connection test - totalForms:', totalForms.toString());

      }).catch(err => {
        console.error('Contract connection test failed:', err);
        console.error('This usually means the contract is not deployed on this network or the address is wrong');
      });
    }
  }, [signer]);

  const createForm = async (
    title: string,
    description: string,
    questions: { text: string; required: boolean; requiresProof: boolean }[]
  ) => {
    if (!contract) {
      throw new Error('Contract not available');
    }

    setLoading(true);
    try {
      const questionTexts = questions.map(q => q.text);
      const requiredFlags = questions.map(q => q.required);
      const proofFlags = questions.map(q => q.requiresProof);

      console.log('Creating form with:', { title, description, questionTexts, requiredFlags, proofFlags });
      console.log('Contract address being used:', CONTRACT_ADDRESS);
      console.log('Account creating form:', account);
      
      const tx = await contract.createForm(title, description, questionTexts, requiredFlags, proofFlags);
      console.log('Form creation transaction:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Form created successfully, receipt:', receipt);
      console.log('Gas used:', receipt.gasUsed.toString());
      
      // Listen for FormCreated event
      if (receipt.logs && receipt.logs.length > 0) {
        console.log('Transaction logs:', receipt.logs);
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async (
    formId: number,
    username: string,
    email: string,
    answers: string[]
  ) => {
    if (!contract) {
      throw new Error('Contract not available');
    }

    setLoading(true);
    try {
      const tx = await contract.submitForm(formId, username, email, answers);
      console.log('Form submission transaction:', tx.hash);
      
      await tx.wait();
      console.log('Form submitted successfully');
      
      return tx.hash;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAllForms = async (): Promise<FormData[]> => {
    if (!contract) {
      console.log('Contract not available for getAllForms');
      return [];
    }

    try {
      console.log('=== CALLING getAllForms ===');
      console.log('Contract address:', CONTRACT_ADDRESS);
      console.log('Contract instance:', contract);
      console.log('Signer:', !!signer);
      console.log('Account:', account);
      
      // First, let's check if the contract is working by getting totalForms
      const totalFormsResult = await contract.totalForms();
      const totalFormsCount = Number(totalFormsResult.toString());
      console.log('Total forms from contract:', totalFormsCount);
      
      if (totalFormsCount === 0) {
        console.log('No forms found in contract (totalForms = 0)');
        return [];
      }
      
      // Now call getAllForms
      const getAllFormsResult = await contract.getAllForms();
      const [titles, activeStatus, submissionCounts, creators] = getAllFormsResult;
      
      console.log('getAllForms raw data:', {
        titles,
        activeStatus,
        submissionCounts,
        creators,
        titlesLength: titles.length
      });
      
      if (titles.length === 0) {
        console.log('No forms found in getAllForms response');
        return [];
      }
      
      const forms: FormData[] = [];
      for (let i = 0; i < titles.length; i++) {
        console.log(`Processing form ${i}:`, titles[i]);
        
        try {
          console.log(`Getting details for form ${i}...`);
          const formDetailsResult = await contract.getForm(i);
          console.log(`Form ${i} details raw:`, formDetailsResult);
          
          console.log(`Getting questions for form ${i}...`);
          const questionsResult = await contract.getFormQuestions(i);
          console.log(`Form ${i} questions raw:`, questionsResult);
          
          const formData = {
            id: i,
            title: titles[i],
            description: formDetailsResult.description,
            questions: questionsResult,
            isActive: activeStatus[i],
            totalSubmissions: Number(submissionCounts[i].toString()),
            createdAt: Number(formDetailsResult.createdAt.toString()),
            creator: creators[i],
          };
          
          console.log(`Form ${i} processed:`, formData);
          forms.push(formData);
        } catch (error) {
          console.error(`Error fetching details for form ${i}:`, error);
          console.error(`Error details:`, error.message);
        }
      }
      
      console.log('Final forms array:', forms);
      console.log('Returning', forms.length, 'forms');
      return forms;
    } catch (error) {
      console.error('Error fetching forms:', error);
      console.error('Error details:', error.message);
      if (error.data) {
        console.error('Error data:', error.data);
      }
      if (error.code) {
        console.error('Error code:', error.code);
      }
      return [];
    }
  };

  const getFormSubmissions = async (formId: number): Promise<Submission[]> => {
    if (!contract || !account) return [];

    try {
      // Check if current user is the creator of the form
      const isCreator = await contract.isFormCreator(formId, account);
      if (!isCreator) {
        throw new Error('Only form creator can view submissions');
      }

      const submissions = await contract.getAllFormSubmissions(formId);
      return submissions.map((sub: any) => ({
        formId: Number(sub.formId),
        username: sub.username,
        email: sub.email,
        answers: sub.answers,
        timestamp: Number(sub.timestamp),
        submitter: sub.submitter,
      }));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  };

  const getStats = async () => {
    if (!contract) return { totalForms: 0, totalSubmissions: 0 };

    try {
      console.log('Getting stats...');
      const statsResult = await contract.getStats();
      const [totalForms, totalSubmissions] = statsResult;
      
      const stats = {
        totalForms: Number(totalForms.toString()),
        totalSubmissions: Number(totalSubmissions.toString()),
      };
      
      console.log('Stats retrieved:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { totalForms: 0, totalSubmissions: 0 };
    }
  };

  const isFormCreator = async (formId: number): Promise<boolean> => {
    if (!contract || !account) return false;

    try {
      return await contract.isFormCreator(formId, account);
    } catch (error) {
      console.error('Error checking form creator:', error);
      return false;
    }
  };

  // Funzioni per gestire le proof Web2Json
  const setProofVerified = async (
    formId: number,
    user: string,
    questionIndex: number,
    verified: boolean
  ) => {
    if (!contract) {
      throw new Error('Contract not available');
    }

    try {
      const tx = await contract.setProofVerified(formId, user, questionIndex, verified);
      await tx.wait();
      console.log('Proof verification status updated');
      return tx.hash;
    } catch (error) {
      console.error('Error setting proof verified:', error);
      throw error;
    }
  };

  const isProofVerified = async (
    formId: number,
    user: string,
    questionIndex: number
  ): Promise<boolean> => {
    if (!contract) return false;

    try {
      return await contract.isProofVerified(formId, user, questionIndex);
    } catch (error) {
      console.error('Error checking proof verification:', error);
      return false;
    }
  };

  const areAllProofsVerified = async (
    formId: number,
    user: string
  ): Promise<boolean> => {
    if (!contract) return false;

    try {
      return await contract.areAllProofsVerified(formId, user);
    } catch (error) {
      console.error('Error checking all proofs verified:', error);
      return false;
    }
  };

  const getProofRequirements = async (formId: number): Promise<boolean[]> => {
    if (!contract) return [];

    try {
      return await contract.getProofRequirements(formId);
    } catch (error) {
      console.error('Error getting proof requirements:', error);
      return [];
    }
  };

  return {
    contract,
    loading,
    createForm,
    submitForm,
    getAllForms,
    getFormSubmissions,
    getStats,
    isFormCreator,
    isConnected,
    // Funzioni proof
    setProofVerified,
    isProofVerified,
    areAllProofsVerified,
    getProofRequirements,
  };
};
