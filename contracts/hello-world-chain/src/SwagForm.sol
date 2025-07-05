// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract SwagForm {
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
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public proofVerified; // formId => user => questionIndex => verified
    
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
    
    // Modifier per verificare che il form esista
    modifier formExists(uint256 formId) {
        require(formId < totalForms, "Form does not exist");
        _;
    }
    
    // Modifier per verificare che l'utente sia il creatore del form
    modifier onlyFormCreator(uint256 formId) {
        require(forms[formId].creator == msg.sender, "Only form creator can perform this action");
        _;
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
        require(_questions.length == _isRequired.length, "Questions and required flags must have same length");
        require(_questions.length == _requiresProof.length, "Questions and proof flags must have same length");
        
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
            forms[formId].questions.push(Question({
                questionText: _questions[i],
                isRequired: _isRequired[i],
                requiresProof: _requiresProof[i]
            }));
        }
        
        // Aggiungi il form alla lista dell'utente
        userForms[msg.sender].push(formId);
        
        totalForms++;
        
        emit FormCreated(formId, msg.sender, _title, _questions.length, block.timestamp);
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
        require(!emailExists[_formId][_email], "Email already registered for this form");
        require(submissions[_formId][msg.sender].timestamp == 0, "Address already submitted to this form");
        require(_answers.length == forms[_formId].questions.length, "Answer count must match question count");
        
        // Verifica che le risposte obbligatorie siano fornite
        for (uint256 i = 0; i < forms[_formId].questions.length; i++) {
            if (forms[_formId].questions[i].isRequired) {
                require(bytes(_answers[i]).length > 0, "Required question not answered");
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
        
        emit FormSubmitted(_formId, msg.sender, _email, _username, block.timestamp);
    }
    
    // Funzioni per gestire le proof Web2Json
    function setProofVerified(uint256 _formId, address _user, uint256 _questionIndex, bool _verified) external formExists(_formId) {
        // Nota: questa funzione dovrebbe essere chiamata solo dal contratto Coston2 autorizzato
        // Per ora è pubblica per testing, ma andrebbe aggiunta la logica di autorizzazione
        proofVerified[_formId][_user][_questionIndex] = _verified;
    }
    
    function isProofVerified(uint256 _formId, address _user, uint256 _questionIndex) external view formExists(_formId) returns (bool) {
        return proofVerified[_formId][_user][_questionIndex];
    }
    
    function areAllProofsVerified(uint256 _formId, address _user) external view formExists(_formId) returns (bool) {
        Form storage form = forms[_formId];
        
        for (uint256 i = 0; i < form.questions.length; i++) {
            if (form.questions[i].requiresProof && !proofVerified[_formId][_user][i]) {
                return false;
            }
        }
        
        return true;
    }
    
    function getProofRequirements(uint256 _formId) external view formExists(_formId) returns (bool[] memory) {
        Form storage form = forms[_formId];
        bool[] memory requirements = new bool[](form.questions.length);
        
        for (uint256 i = 0; i < form.questions.length; i++) {
            requirements[i] = form.questions[i].requiresProof;
        }
        
        return requirements;
    }
    
    // Funzioni di visualizzazione
    function getForm(uint256 _formId) external view formExists(_formId) returns (
        string memory title,
        string memory description,
        uint256 questionsCount,
        bool isActive,
        uint256 submissionsCount,
        uint256 createdAt,
        address creator
    ) {
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
    
    function getFormQuestions(uint256 _formId) external view formExists(_formId) returns (Question[] memory) {
        return forms[_formId].questions;
    }
    
    function getSubmission(uint256 _formId, address _user) external view formExists(_formId) returns (Submission memory) {
        return submissions[_formId][_user];
    }
    
    function hasSubmitted(uint256 _formId, address _user) external view formExists(_formId) returns (bool) {
        return submissions[_formId][_user].timestamp > 0;
    }
    
    function getFormSubmitters(uint256 _formId) external view formExists(_formId) returns (address[] memory) {
        return formSubmitters[_formId];
    }
    
    function getUserForms(address _user) external view returns (uint256[] memory) {
        return userForms[_user];
    }
    
    // Funzioni di gestione form (solo per il creatore)
    function setFormActive(uint256 _formId, bool _active) external formExists(_formId) onlyFormCreator(_formId) {
        forms[_formId].isActive = _active;
        emit FormStatusChanged(_formId, _active);
    }
    
    function updateFormTitle(uint256 _formId, string calldata _title) external formExists(_formId) onlyFormCreator(_formId) {
        require(bytes(_title).length > 0, "Title is required");
        forms[_formId].title = _title;
    }
    
    function updateFormDescription(uint256 _formId, string calldata _description) external formExists(_formId) onlyFormCreator(_formId) {
        forms[_formId].description = _description;
    }
    
    // Funzione per ottenere statistiche generali
    function getStats() external view returns (
        uint256 totalFormsCount,
        uint256 totalSubmissionsCount
    ) {
        return (totalForms, totalSubmissions);
    }
    
    // Funzione per ottenere tutte le submission di un form (solo per il creatore del form)
    function getAllFormSubmissions(uint256 _formId) external view formExists(_formId) onlyFormCreator(_formId) returns (Submission[] memory) {
        address[] memory submitters = formSubmitters[_formId];
        Submission[] memory formSubmissions = new Submission[](submitters.length);
        
        for (uint256 i = 0; i < submitters.length; i++) {
            formSubmissions[i] = submissions[_formId][submitters[i]];
        }
        
        return formSubmissions;
    }
    
    // Funzione per ottenere lista di tutti i form pubblici (titoli, status, contatori)
    function getAllForms() external view returns (
        string[] memory titles,
        bool[] memory activeStatus,
        uint256[] memory submissionCounts,
        address[] memory creators
    ) {
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
    function getUserStats(address _user) external view returns (
        uint256 formsCreated,
        uint256 formsSubmitted
    ) {
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
    function isFormCreator(uint256 _formId, address _user) external view formExists(_formId) returns (bool) {
        return forms[_formId].creator == _user;
    }
} 