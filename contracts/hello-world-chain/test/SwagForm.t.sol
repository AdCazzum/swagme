// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {SwagForm} from "../src/SwagForm.sol";

contract SwagFormTest is Test {
    SwagForm public swagForm;
    
    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    
    function setUp() public {
        swagForm = new SwagForm();
    }
    
    function testInitialState() public {
        assertEq(swagForm.totalForms(), 0);
        assertEq(swagForm.totalSubmissions(), 0);
        assertEq(swagForm.owner(), owner);
        
        (uint256 totalFormsCount, uint256 totalSubmissionsCount) = swagForm.getStats();
        assertEq(totalFormsCount, 0);
        assertEq(totalSubmissionsCount, 0);
    }
    
    function testCreateForm() public {
        string[] memory questions = new string[](3);
        questions[0] = "What is your favorite color?";
        questions[1] = "What is your age?";
        questions[2] = "Any additional comments?";
        
        bool[] memory isRequired = new bool[](3);
        isRequired[0] = true;
        isRequired[1] = true;
        isRequired[2] = false;
        
        swagForm.createForm(
            "User Survey",
            "A simple survey about users",
            questions,
            isRequired
        );
        
        assertEq(swagForm.totalForms(), 1);
        
        (
            string memory title,
            string memory description,
            uint256 questionsCount,
            bool isActive,
            uint256 totalSubmissions,
            uint256 createdAt
        ) = swagForm.getForm(0);
        
        assertEq(title, "User Survey");
        assertEq(description, "A simple survey about users");
        assertEq(questionsCount, 3);
        assertTrue(isActive);
        assertEq(totalSubmissions, 0);
        assertGt(createdAt, 0);
    }
    
    function testGetFormQuestions() public {
        string[] memory questions = new string[](2);
        questions[0] = "What is your name?";
        questions[1] = "What is your email?";
        
        bool[] memory isRequired = new bool[](2);
        isRequired[0] = true;
        isRequired[1] = true;
        
        swagForm.createForm("Test Form", "Test Description", questions, isRequired);
        
        SwagForm.Question[] memory formQuestions = swagForm.getFormQuestions(0);
        
        assertEq(formQuestions.length, 2);
        assertEq(formQuestions[0].questionText, "What is your name?");
        assertTrue(formQuestions[0].isRequired);
        assertEq(formQuestions[1].questionText, "What is your email?");
        assertTrue(formQuestions[1].isRequired);
    }
    
    function testSubmitForm() public {
        // Crea un form
        string[] memory questions = new string[](2);
        questions[0] = "What is your favorite color?";
        questions[1] = "Any comments?";
        
        bool[] memory isRequired = new bool[](2);
        isRequired[0] = true;
        isRequired[1] = false;
        
        swagForm.createForm("Color Survey", "Tell us about colors", questions, isRequired);
        
        // Sottometti il form
        string[] memory answers = new string[](2);
        answers[0] = "Blue";
        answers[1] = "I love blue!";
        
        vm.prank(user1);
        swagForm.submitForm(0, "alice", "alice@example.com", answers);
        
        // Verifica la submission
        assertTrue(swagForm.hasSubmitted(0, user1));
        
        SwagForm.Submission memory submission = swagForm.getSubmission(0, user1);
        assertEq(submission.formId, 0);
        assertEq(submission.username, "alice");
        assertEq(submission.email, "alice@example.com");
        assertEq(submission.answers[0], "Blue");
        assertEq(submission.answers[1], "I love blue!");
        assertEq(submission.submitter, user1);
        assertGt(submission.timestamp, 0);
        
        // Verifica che i contatori siano aggiornati
        assertEq(swagForm.totalSubmissions(), 1);
        
        (, , , , uint256 formSubmissions, ) = swagForm.getForm(0);
        assertEq(formSubmissions, 1);
    }
    
    function testCannotSubmitWithoutRequiredAnswers() public {
        string[] memory questions = new string[](2);
        questions[0] = "Required question?";
        questions[1] = "Optional question?";
        
        bool[] memory isRequired = new bool[](2);
        isRequired[0] = true;
        isRequired[1] = false;
        
        swagForm.createForm("Test Form", "Test", questions, isRequired);
        
        string[] memory answers = new string[](2);
        answers[0] = ""; // Risposta vuota per domanda obbligatoria
        answers[1] = "Optional answer";
        
        vm.prank(user1);
        vm.expectRevert("Required question not answered");
        swagForm.submitForm(0, "alice", "alice@example.com", answers);
    }
    
    function testCannotSubmitDuplicateEmail() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;
        
        swagForm.createForm("Test Form", "Test", questions, isRequired);
        
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";
        
        vm.prank(user1);
        swagForm.submitForm(0, "alice", "alice@example.com", answers);
        
        vm.prank(user2);
        vm.expectRevert("Email already registered for this form");
        swagForm.submitForm(0, "bob", "alice@example.com", answers);
    }
    
    function testCannotSubmitFromSameAddressTwice() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;
        
        swagForm.createForm("Test Form", "Test", questions, isRequired);
        
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";
        
        vm.prank(user1);
        swagForm.submitForm(0, "alice", "alice@example.com", answers);
        
        vm.prank(user1);
        vm.expectRevert("Address already submitted to this form");
        swagForm.submitForm(0, "alice2", "alice2@example.com", answers);
    }
    
    function testCanSubmitToMultipleForms() public {
        // Crea due form
        string[] memory questions1 = new string[](1);
        questions1[0] = "Form 1 question?";
        bool[] memory isRequired1 = new bool[](1);
        isRequired1[0] = true;
        
        string[] memory questions2 = new string[](1);
        questions2[0] = "Form 2 question?";
        bool[] memory isRequired2 = new bool[](1);
        isRequired2[0] = true;
        
        swagForm.createForm("Form 1", "First form", questions1, isRequired1);
        swagForm.createForm("Form 2", "Second form", questions2, isRequired2);
        
        // Sottometti a entrambi i form
        string[] memory answers1 = new string[](1);
        answers1[0] = "Answer to form 1";
        
        string[] memory answers2 = new string[](1);
        answers2[0] = "Answer to form 2";
        
        vm.prank(user1);
        swagForm.submitForm(0, "alice", "alice@example.com", answers1);
        
        vm.prank(user1);
        swagForm.submitForm(1, "alice", "alice@example.com", answers2);
        
        // Verifica che entrambe le submission esistano
        assertTrue(swagForm.hasSubmitted(0, user1));
        assertTrue(swagForm.hasSubmitted(1, user1));
        
        SwagForm.Submission memory submission1 = swagForm.getSubmission(0, user1);
        SwagForm.Submission memory submission2 = swagForm.getSubmission(1, user1);
        
        assertEq(submission1.formId, 0);
        assertEq(submission2.formId, 1);
        assertEq(submission1.answers[0], "Answer to form 1");
        assertEq(submission2.answers[0], "Answer to form 2");
    }
    
    function testFormManagement() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;
        
        swagForm.createForm("Test Form", "Test", questions, isRequired);
        
        // Disattiva il form
        swagForm.setFormActive(0, false);
        
        (, , , bool isActive, , ) = swagForm.getForm(0);
        assertFalse(isActive);
        
        // Prova a sottomettere a form inattivo
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";
        
        vm.prank(user1);
        vm.expectRevert("Form is not active");
        swagForm.submitForm(0, "alice", "alice@example.com", answers);
        
        // Riattiva il form
        swagForm.setFormActive(0, true);
        
        (, , , isActive, , ) = swagForm.getForm(0);
        assertTrue(isActive);
        
        // Ora la submission dovrebbe funzionare
        vm.prank(user1);
        swagForm.submitForm(0, "alice", "alice@example.com", answers);
        
        assertTrue(swagForm.hasSubmitted(0, user1));
    }
    
    function testUpdateFormDetails() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;
        
        swagForm.createForm("Original Title", "Original Description", questions, isRequired);
        
        // Aggiorna titolo e descrizione
        swagForm.updateFormTitle(0, "Updated Title");
        swagForm.updateFormDescription(0, "Updated Description");
        
        (string memory title, string memory description, , , , ) = swagForm.getForm(0);
        assertEq(title, "Updated Title");
        assertEq(description, "Updated Description");
    }
    
    function testGetAllForms() public {
        // Crea múltipli form
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;
        
        swagForm.createForm("Form 1", "Description 1", questions, isRequired);
        swagForm.createForm("Form 2", "Description 2", questions, isRequired);
        
        // Disattiva il secondo form
        swagForm.setFormActive(1, false);
        
        (
            string[] memory titles,
            bool[] memory activeStatus,
            uint256[] memory submissionCounts
        ) = swagForm.getAllForms();
        
        assertEq(titles.length, 2);
        assertEq(titles[0], "Form 1");
        assertEq(titles[1], "Form 2");
        assertTrue(activeStatus[0]);
        assertFalse(activeStatus[1]);
        assertEq(submissionCounts[0], 0);
        assertEq(submissionCounts[1], 0);
    }
    
    function testGetFormSubmitters() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;
        
        swagForm.createForm("Test Form", "Test", questions, isRequired);
        
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";
        
        // Aggiungi alcune submission
        vm.prank(user1);
        swagForm.submitForm(0, "alice", "alice@example.com", answers);
        
        vm.prank(user2);
        swagForm.submitForm(0, "bob", "bob@example.com", answers);
        
        address[] memory submitters = swagForm.getFormSubmitters(0);
        assertEq(submitters.length, 2);
        assertEq(submitters[0], user1);
        assertEq(submitters[1], user2);
    }
    
    function testOnlyOwnerFunctions() public {
        vm.prank(user1);
        vm.expectRevert("Only owner can call this function");
        swagForm.createForm("Test", "Test", new string[](1), new bool[](1));
        
        vm.prank(user1);
        vm.expectRevert("Only owner can call this function");
        swagForm.transferOwnership(user1);
    }
    
    function testFormExistsModifier() public {
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";
        
        vm.prank(user1);
        vm.expectRevert("Form does not exist");
        swagForm.submitForm(999, "alice", "alice@example.com", answers);
    }
    
    function testRequiredFields() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;
        
        swagForm.createForm("Test Form", "Test", questions, isRequired);
        
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";
        
        // Username vuoto
        vm.prank(user1);
        vm.expectRevert("Username is required");
        swagForm.submitForm(0, "", "alice@example.com", answers);
        
        // Email vuota
        vm.prank(user1);
        vm.expectRevert("Email is required");
        swagForm.submitForm(0, "alice", "", answers);
        
        // Numero di risposte errato
        string[] memory wrongAnswers = new string[](2);
        wrongAnswers[0] = "Answer 1";
        wrongAnswers[1] = "Answer 2";
        
        vm.prank(user1);
        vm.expectRevert("Answer count must match question count");
        swagForm.submitForm(0, "alice", "alice@example.com", wrongAnswers);
    }
    
    function testCreateFormValidation() public {
        // Titolo vuoto
        vm.expectRevert("Title is required");
        swagForm.createForm("", "Description", new string[](1), new bool[](1));
        
        // Nessuna domanda
        vm.expectRevert("At least one question is required");
        swagForm.createForm("Title", "Description", new string[](0), new bool[](0));
        
        // Lunghezza diversa tra domande e flag required
        string[] memory questions = new string[](2);
        questions[0] = "Question 1";
        questions[1] = "Question 2";
        
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;
        
        vm.expectRevert("Questions and required flags must have same length");
        swagForm.createForm("Title", "Description", questions, isRequired);
    }
} 