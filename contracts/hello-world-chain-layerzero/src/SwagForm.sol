// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OAppOptionsType3} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SwagForm is OApp, OAppOptionsType3 {
    // Struttura per una singola domanda
    struct Question {
        string questionText;
        bool isRequired;
        bool requiresProof; // Nuovo campo per indicare se la domanda richiede una proof Web2Json
    }

    // Struttura per un form
    struct Form {
        string title;
        string description;
        Question[] questions;
        bool isActive;
        uint256 totalSubmissions;
        uint256 createdAt;
        address creator;
    }

    // Struttura per una submission
    struct Submission {
        uint256 formId;
        string username;
        string email;
        string[] answers;
        uint256 timestamp;
        address submitter;
    }

    // Mappings principali
    mapping(uint256 => Form) public forms;
    mapping(uint256 => mapping(address => Submission)) public submissions; // formId => user => submission
    mapping(uint256 => mapping(string => bool)) public emailExists; // formId => email => exists
    mapping(uint256 => address[]) public formSubmitters; // formId => array of submitters
    mapping(address => uint256[]) public userForms; // user => array of form IDs created by user
    mapping(uint256 => mapping(address => mapping(uint256 => bool)))
        public proofVerified; // formId => user => questionIndex => verified

    // Contatori
    uint256 public totalForms;
    uint256 public totalSubmissions;

    // Eventi
    event FormCreated(
        uint256 indexed formId,
        address indexed creator,
        string title,
        uint256 questionsCount,
        uint256 timestamp
    );

    event FormSubmitted(
        uint256 indexed formId,
        address indexed user,
        string email,
        string username,
        uint256 timestamp
    );

    event FormStatusChanged(uint256 indexed formId, bool active);

    event DataReceived(
        uint256 indexed formId,
        address indexed submitter,
        string username,
        string email,
        uint256 timestamp
    );

    // Modifier per verificare che il form esista
    modifier formExists(uint256 formId) {
        require(formId < totalForms, "Form does not exist");
        _;
    }

    // Modifier per verificare che l'utente sia il creatore del form
    modifier onlyFormCreator(uint256 formId) {
        require(
            forms[formId].creator == msg.sender,
            "Only form creator can perform this action"
        );
        _;
    }

    string public lastMessage;
    uint16 public constant SEND = 1;

    constructor(
        address _endpoint,
        address _owner
    ) OApp(_endpoint, _owner) Ownable(_owner) {}

    /**
     * @notice Quotes the gas needed to pay for the full omnichain transaction in native gas or ZRO token.
     * @param _dstEid Destination chain's endpoint ID.
     * @param _string The string to send.
     * @param _options Message execution options (e.g., for sending gas to destination).
     * @param _payInLzToken Whether to return fee in ZRO token.
     * @return fee A `MessagingFee` struct containing the calculated gas fee in either the native token or ZRO token.
     */
    function quoteSendString(
        uint32 _dstEid,
        string calldata _string,
        bytes calldata _options,
        bool _payInLzToken
    ) public view returns (MessagingFee memory fee) {
        bytes memory _message = abi.encode(_string);
        fee = _quote(
            _dstEid,
            _message,
            combineOptions(_dstEid, SEND, _options),
            _payInLzToken
        );
    }

    /// @notice Send a string to a remote OApp on another chain
    /// @param _dstEid   Destination Endpoint ID (uint32)
    /// @param _string  The string to send
    /// @param _options  Execution options for gas on the destination (bytes)
    function sendString(
        uint32 _dstEid,
        string calldata _string,
        bytes calldata _options
    ) external payable {
        bytes memory _message = abi.encode(_string);

        _lzSend(
            _dstEid,
            _message,
            combineOptions(_dstEid, SEND, _options),
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    /// @notice Invoked by OAppReceiver when EndpointV2.lzReceive is called
    /// @dev   _origin    Metadata (source chain, sender address, nonce)
    /// @dev   _guid      Global unique ID for tracking this message
    /// @param _message   ABI-encoded bytes (the string we sent earlier)
    /// @dev   _executor  Executor address that delivered the message
    /// @dev   _extraData Additional data from the Executor (unused here)
    function _lzReceive(
        Origin calldata /*_origin*/,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        string memory _string = abi.decode(_message, (string));

        lastMessage = _string;

        // Parse dei dati ricevuti
        (
            uint256 formId,
            string memory username,
            string memory email,
            address submitter,
            uint256 timestamp,
            string[] memory answers,
            string[] memory proofs
        ) = parseReceivedData(_string);

        // Emetti evento per notificare la ricezione
        emit DataReceived(formId, submitter, username, email, timestamp);

        // TODO: Qui puoi aggiungere logica aggiuntiva per gestire i dati ricevuti
        // Ad esempio, salvare in un mapping specifico per dati cross-chain
    }

    // Funzione per creare un nuovo form
    function createForm(
        string calldata _title,
        string calldata _description,
        string[] calldata _questions,
        bool[] calldata _isRequired,
        bool[] calldata _requiresProof
    ) external {
        require(bytes(_title).length > 0, "Title is required");
        require(_questions.length > 0, "At least one question is required");
        require(
            _questions.length == _isRequired.length,
            "Questions and required flags must have same length"
        );
        require(
            _questions.length == _requiresProof.length,
            "Questions and proof flags must have same length"
        );

        uint256 formId = totalForms;

        // Crea il form
        forms[formId].title = _title;
        forms[formId].description = _description;
        forms[formId].isActive = true;
        forms[formId].totalSubmissions = 0;
        forms[formId].createdAt = block.timestamp;
        forms[formId].creator = msg.sender;

        // Aggiungi le domande
        for (uint256 i = 0; i < _questions.length; i++) {
            forms[formId].questions.push(
                Question({
                    questionText: _questions[i],
                    isRequired: _isRequired[i],
                    requiresProof: _requiresProof[i]
                })
            );
        }

        // Aggiungi il form alla lista dell'utente
        userForms[msg.sender].push(formId);

        totalForms++;

        emit FormCreated(
            formId,
            msg.sender,
            _title,
            _questions.length,
            block.timestamp
        );
    }

    // Funzione per sottomettere un form
    function submitForm(
        uint256 _formId,
        string calldata _username,
        string calldata _email,
        string[] calldata _answers
    ) external formExists(_formId) {
        require(forms[_formId].isActive, "Form is not active");
        require(bytes(_username).length > 0, "Username is required");
        require(bytes(_email).length > 0, "Email is required");
        require(
            !emailExists[_formId][_email],
            "Email already registered for this form"
        );
        require(
            submissions[_formId][msg.sender].timestamp == 0,
            "Address already submitted to this form"
        );
        require(
            _answers.length == forms[_formId].questions.length,
            "Answer count must match question count"
        );

        // Verifica che le risposte obbligatorie siano fornite
        for (uint256 i = 0; i < forms[_formId].questions.length; i++) {
            if (forms[_formId].questions[i].isRequired) {
                require(
                    bytes(_answers[i]).length > 0,
                    "Required question not answered"
                );
            }
        }

        // Crea la submission
        submissions[_formId][msg.sender] = Submission({
            formId: _formId,
            username: _username,
            email: _email,
            answers: _answers,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        // Aggiorna i tracking
        emailExists[_formId][_email] = true;
        formSubmitters[_formId].push(msg.sender);
        forms[_formId].totalSubmissions++;
        totalSubmissions++;

        uint32 _flareChainEid = 30295; // Flare Mainnet Endpoint ID
        string[] memory _proofStatus = new string[](0);
        string memory _data = string(
            abi.encodePacked(
                "FormID:",
                uint256ToString(_formId),
                "|Username:",
                _username,
                "|Email:",
                _email,
                "|Submitter:",
                addressToString(msg.sender),
                "|Timestamp:",
                uint256ToString(block.timestamp),
                "|Answers:",
                stringArrayToString(_answers),
                "|Proofs:",
                stringArrayToString(_proofStatus)
            )
        );

        // Get fee estimate first
        MessagingFee memory fee = this.quoteSendString(
            _flareChainEid,
            _data,
            "0x", // no additional options
            false // pay in native gas
        );

        // Then send with the estimated fee
        this.sendString{value: fee.nativeFee}(_flareChainEid, _data, "0x");

        emit FormSubmitted(
            _formId,
            msg.sender,
            _email,
            _username,
            block.timestamp
        );
    }

    // Funzioni per gestire le proof Web2Json
    function setProofVerified(
        uint256 _formId,
        address _user,
        uint256 _questionIndex,
        bool _verified
    ) external formExists(_formId) {
        // Nota: questa funzione dovrebbe essere chiamata solo dal contratto Coston2 autorizzato
        // Per ora è pubblica per testing, ma andrebbe aggiunta la logica di autorizzazione
        proofVerified[_formId][_user][_questionIndex] = _verified;
    }

    function isProofVerified(
        uint256 _formId,
        address _user,
        uint256 _questionIndex
    ) external view formExists(_formId) returns (bool) {
        return proofVerified[_formId][_user][_questionIndex];
    }

    function areAllProofsVerified(
        uint256 _formId,
        address _user
    ) external view formExists(_formId) returns (bool) {
        Form storage form = forms[_formId];

        for (uint256 i = 0; i < form.questions.length; i++) {
            if (
                form.questions[i].requiresProof &&
                !proofVerified[_formId][_user][i]
            ) {
                return false;
            }
        }

        return true;
    }

    function getProofRequirements(
        uint256 _formId
    ) external view formExists(_formId) returns (bool[] memory) {
        Form storage form = forms[_formId];
        bool[] memory requirements = new bool[](form.questions.length);

        for (uint256 i = 0; i < form.questions.length; i++) {
            requirements[i] = form.questions[i].requiresProof;
        }

        return requirements;
    }

    // Funzioni di visualizzazione
    function getForm(
        uint256 _formId
    )
        external
        view
        formExists(_formId)
        returns (
            string memory title,
            string memory description,
            uint256 questionsCount,
            bool isActive,
            uint256 submissionsCount,
            uint256 createdAt,
            address creator
        )
    {
        Form storage form = forms[_formId];
        return (
            form.title,
            form.description,
            form.questions.length,
            form.isActive,
            form.totalSubmissions,
            form.createdAt,
            form.creator
        );
    }

    function getFormQuestions(
        uint256 _formId
    ) external view formExists(_formId) returns (Question[] memory) {
        return forms[_formId].questions;
    }

    function getSubmission(
        uint256 _formId,
        address _user
    ) external view formExists(_formId) returns (Submission memory) {
        return submissions[_formId][_user];
    }

    function hasSubmitted(
        uint256 _formId,
        address _user
    ) external view formExists(_formId) returns (bool) {
        return submissions[_formId][_user].timestamp > 0;
    }

    function getFormSubmitters(
        uint256 _formId
    ) external view formExists(_formId) returns (address[] memory) {
        return formSubmitters[_formId];
    }

    function getUserForms(
        address _user
    ) external view returns (uint256[] memory) {
        return userForms[_user];
    }

    // Funzioni di gestione form (solo per il creatore)
    function setFormActive(
        uint256 _formId,
        bool _active
    ) external formExists(_formId) onlyFormCreator(_formId) {
        forms[_formId].isActive = _active;
        emit FormStatusChanged(_formId, _active);
    }

    function updateFormTitle(
        uint256 _formId,
        string calldata _title
    ) external formExists(_formId) onlyFormCreator(_formId) {
        require(bytes(_title).length > 0, "Title is required");
        forms[_formId].title = _title;
    }

    function updateFormDescription(
        uint256 _formId,
        string calldata _description
    ) external formExists(_formId) onlyFormCreator(_formId) {
        forms[_formId].description = _description;
    }

    // Funzione per ottenere statistiche generali
    function getStats()
        external
        view
        returns (uint256 totalFormsCount, uint256 totalSubmissionsCount)
    {
        return (totalForms, totalSubmissions);
    }

    // Funzione per ottenere tutte le submission di un form (solo per il creatore del form)
    function getAllFormSubmissions(
        uint256 _formId
    )
        external
        view
        formExists(_formId)
        onlyFormCreator(_formId)
        returns (Submission[] memory)
    {
        address[] memory submitters = formSubmitters[_formId];
        Submission[] memory formSubmissions = new Submission[](
            submitters.length
        );

        for (uint256 i = 0; i < submitters.length; i++) {
            formSubmissions[i] = submissions[_formId][submitters[i]];
        }

        return formSubmissions;
    }

    // Funzione per ottenere lista di tutti i form pubblici (titoli, status, contatori)
    function getAllForms()
        external
        view
        returns (
            string[] memory titles,
            bool[] memory activeStatus,
            uint256[] memory submissionCounts,
            address[] memory creators
        )
    {
        titles = new string[](totalForms);
        activeStatus = new bool[](totalForms);
        submissionCounts = new uint256[](totalForms);
        creators = new address[](totalForms);

        for (uint256 i = 0; i < totalForms; i++) {
            titles[i] = forms[i].title;
            activeStatus[i] = forms[i].isActive;
            submissionCounts[i] = forms[i].totalSubmissions;
            creators[i] = forms[i].creator;
        }

        return (titles, activeStatus, submissionCounts, creators);
    }

    // Funzione per ottenere statistiche di un utente
    function getUserStats(
        address _user
    ) external view returns (uint256 formsCreated, uint256 formsSubmitted) {
        formsCreated = userForms[_user].length;

        // Conta le submission dell'utente
        uint256 submittedCount = 0;
        for (uint256 i = 0; i < totalForms; i++) {
            if (submissions[i][_user].timestamp > 0) {
                submittedCount++;
            }
        }

        return (formsCreated, submittedCount);
    }

    // Funzione per verificare se un utente è il creatore di un form
    function isFormCreator(
        uint256 _formId,
        address _user
    ) external view formExists(_formId) returns (bool) {
        return forms[_formId].creator == _user;
    }

    // Helper functions per conversione in stringa
    function uint256ToString(
        uint256 value
    ) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function addressToString(
        address _addr
    ) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function stringArrayToString(
        string[] memory _array
    ) internal pure returns (string memory) {
        if (_array.length == 0) {
            return "";
        }

        string memory result = "";
        for (uint256 i = 0; i < _array.length; i++) {
            result = string(
                abi.encodePacked(result, i == 0 ? "" : ",", _array[i])
            );
        }
        return result;
    }

    // Funzioni per il parsing dei dati ricevuti
    function parseReceivedData(
        string memory data
    )
        internal
        pure
        returns (
            uint256 formId,
            string memory username,
            string memory email,
            address submitter,
            uint256 timestamp,
            string[] memory answers,
            string[] memory proofs
        )
    {
        // Split della stringa per "|"
        string[] memory parts = splitString(data, "|");

        require(parts.length >= 7, "Invalid data format");

        // Parse FormID (rimuove "FormID:")
        formId = stringToUint256(
            substring(parts[0], 7, bytes(parts[0]).length)
        );

        // Parse Username (rimuove "Username:")
        username = substring(parts[1], 9, bytes(parts[1]).length);

        // Parse Email (rimuove "Email:")
        email = substring(parts[2], 6, bytes(parts[2]).length);

        // Parse Submitter (rimuove "Submitter:")
        submitter = stringToAddress(
            substring(parts[3], 10, bytes(parts[3]).length)
        );

        // Parse Timestamp (rimuove "Timestamp:")
        timestamp = stringToUint256(
            substring(parts[4], 10, bytes(parts[4]).length)
        );

        // Parse Answers (rimuove "Answers:")
        string memory answersStr = substring(
            parts[5],
            8,
            bytes(parts[5]).length
        );
        answers = splitString(answersStr, ",");

        // Parse Proofs (rimuove "Proofs:")
        string memory proofsStr = substring(
            parts[6],
            7,
            bytes(parts[6]).length
        );
        proofs = splitString(proofsStr, ",");

        // TODO: save proofs in corrects mapping position
    }

    function splitString(
        string memory str,
        string memory delimiter
    ) internal pure returns (string[] memory) {
        bytes memory strBytes = bytes(str);
        bytes memory delimBytes = bytes(delimiter);

        if (strBytes.length == 0) {
            string[] memory empty = new string[](0);
            return empty;
        }

        // Conta il numero di parti
        uint256 count = 1;
        for (uint256 i = 0; i <= strBytes.length - delimBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < delimBytes.length; j++) {
                if (strBytes[i + j] != delimBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                count++;
                i += delimBytes.length - 1;
            }
        }

        string[] memory parts = new string[](count);
        uint256 partIndex = 0;
        uint256 startIndex = 0;

        for (uint256 i = 0; i <= strBytes.length - delimBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < delimBytes.length; j++) {
                if (strBytes[i + j] != delimBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                parts[partIndex] = substring(str, startIndex, i);
                partIndex++;
                startIndex = i + delimBytes.length;
                i += delimBytes.length - 1;
            }
        }

        // Aggiungi l'ultima parte
        parts[partIndex] = substring(str, startIndex, strBytes.length);

        return parts;
    }

    function substring(
        string memory str,
        uint256 startIndex,
        uint256 endIndex
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);

        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }

        return string(result);
    }

    function stringToUint256(
        string memory str
    ) internal pure returns (uint256) {
        bytes memory b = bytes(str);
        uint256 result = 0;

        for (uint256 i = 0; i < b.length; i++) {
            uint8 digit = uint8(b[i]);
            require(digit >= 48 && digit <= 57, "Invalid number");
            result = result * 10 + (digit - 48);
        }

        return result;
    }

    function stringToAddress(
        string memory str
    ) internal pure returns (address) {
        bytes memory b = bytes(str);
        require(b.length == 42, "Invalid address length");
        require(b[0] == "0" && b[1] == "x", "Invalid address format");

        uint160 result = 0;
        for (uint256 i = 2; i < 42; i++) {
            uint8 digit = uint8(b[i]);
            uint8 value;

            if (digit >= 48 && digit <= 57) {
                value = digit - 48;
            } else if (digit >= 97 && digit <= 102) {
                value = digit - 87;
            } else if (digit >= 65 && digit <= 70) {
                value = digit - 55;
            } else {
                revert("Invalid hex character");
            }

            result = result * 16 + value;
        }

        return address(result);
    }
}
