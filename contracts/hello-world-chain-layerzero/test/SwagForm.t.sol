// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {SwagForm} from "../src/SwagForm.sol";

contract SwagFormTest is Test {
    SwagForm public swagForm;

    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public user3 = address(0x3);

    function setUp() public {
        swagForm = new SwagForm(
            address(0x6F475642a6e85809B1c36Fa62763669b1b48DD5B), // Worldchain Mainnet EndpointV2
            address(0x1) // OpenZeppelin Ownable - invalid address for simplicity
        );
    }

    function testInitialState() public view {
        assertEq(swagForm.totalForms(), 0);
        assertEq(swagForm.totalSubmissions(), 0);

        (uint256 totalFormsCount, uint256 totalSubmissionsCount) = swagForm
            .getStats();
        assertEq(totalFormsCount, 0);
        assertEq(totalSubmissionsCount, 0);
    }

    function testAnyoneCanCreateForm() public {
        string[] memory questions = new string[](2);
        questions[0] = "What is your favorite color?";
        questions[1] = "Any additional comments?";

        bool[] memory isRequired = new bool[](2);
        isRequired[0] = true;
        isRequired[1] = false;

        bool[] memory requiresProof = new bool[](2);
        requiresProof[0] = false;
        requiresProof[1] = false;

        // User1 crea un form
        vm.prank(user1);
        swagForm.createForm(
            "User1 Survey",
            "A survey by user1",
            questions,
            isRequired,
            requiresProof
        );

        // User2 crea un altro form
        vm.prank(user2);
        swagForm.createForm(
            "User2 Survey",
            "A survey by user2",
            questions,
            isRequired,
            requiresProof
        );

        assertEq(swagForm.totalForms(), 2);

        // Verifica che user1 sia il creatore del form 0
        assertTrue(swagForm.isFormCreator(0, user1));
        assertFalse(swagForm.isFormCreator(0, user2));

        // Verifica che user2 sia il creatore del form 1
        assertTrue(swagForm.isFormCreator(1, user2));
        assertFalse(swagForm.isFormCreator(1, user1));
    }

    function testGetFormWithCreator() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";

        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        vm.prank(user1);
        swagForm.createForm(
            "Test Form",
            "Test Description",
            questions,
            isRequired,
            requiresProof
        );

        (
            string memory title,
            string memory description,
            uint256 questionsCount,
            bool isActive,
            uint256 totalSubmissions,
            uint256 createdAt,
            address creator
        ) = swagForm.getForm(0);

        assertEq(title, "Test Form");
        assertEq(description, "Test Description");
        assertEq(questionsCount, 1);
        assertTrue(isActive);
        assertEq(totalSubmissions, 0);
        assertGt(createdAt, 0);
        assertEq(creator, user1);
    }

    function testGetUserForms() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        // User1 crea due form
        vm.prank(user1);
        swagForm.createForm(
            "Form 1",
            "Description 1",
            questions,
            isRequired,
            requiresProof
        );

        vm.prank(user1);
        swagForm.createForm(
            "Form 2",
            "Description 2",
            questions,
            isRequired,
            requiresProof
        );

        // User2 crea un form
        vm.prank(user2);
        swagForm.createForm(
            "Form 3",
            "Description 3",
            questions,
            isRequired,
            requiresProof
        );

        // Verifica che user1 abbia 2 form
        uint256[] memory user1Forms = swagForm.getUserForms(user1);
        assertEq(user1Forms.length, 2);
        assertEq(user1Forms[0], 0);
        assertEq(user1Forms[1], 1);

        // Verifica che user2 abbia 1 form
        uint256[] memory user2Forms = swagForm.getUserForms(user2);
        assertEq(user2Forms.length, 1);
        assertEq(user2Forms[0], 2);

        // Verifica che user3 non abbia form
        uint256[] memory user3Forms = swagForm.getUserForms(user3);
        assertEq(user3Forms.length, 0);
    }

    function testOnlyCreatorCanModifyForm() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        // User1 crea un form
        vm.prank(user1);
        swagForm.createForm(
            "Original Title",
            "Original Description",
            questions,
            isRequired,
            requiresProof
        );

        // User1 può modificare il suo form
        vm.prank(user1);
        swagForm.updateFormTitle(0, "Updated Title");

        vm.prank(user1);
        swagForm.updateFormDescription(0, "Updated Description");

        vm.prank(user1);
        swagForm.setFormActive(0, false);

        // Verifica le modifiche
        (
            string memory title,
            string memory description,
            ,
            bool isActive,
            ,
            ,

        ) = swagForm.getForm(0);
        assertEq(title, "Updated Title");
        assertEq(description, "Updated Description");
        assertFalse(isActive);

        // User2 non può modificare il form di user1
        vm.prank(user2);
        vm.expectRevert("Only form creator can perform this action");
        swagForm.updateFormTitle(0, "Hack Title");

        vm.prank(user2);
        vm.expectRevert("Only form creator can perform this action");
        swagForm.updateFormDescription(0, "Hack Description");

        vm.prank(user2);
        vm.expectRevert("Only form creator can perform this action");
        swagForm.setFormActive(0, true);
    }

    function testAnyoneCanSubmitToActiveForm() public {
        string[] memory questions = new string[](2);
        questions[0] = "Required question?";
        questions[1] = "Optional question?";

        bool[] memory isRequired = new bool[](2);
        isRequired[0] = true;
        isRequired[1] = false;

        bool[] memory requiresProof = new bool[](2);
        requiresProof[0] = false;
        requiresProof[1] = false;

        // User1 crea un form
        vm.prank(user1);
        swagForm.createForm(
            "Public Form",
            "Everyone can submit",
            questions,
            isRequired,
            requiresProof
        );

        // User2 sottomette al form di user1
        string[] memory answers = new string[](2);
        answers[0] = "Required answer";
        answers[1] = "Optional answer";

        vm.prank(user2);
        swagForm.submitForm(0, "user2", "user2@example.com", answers);

        // User3 sottomette al form di user1
        vm.prank(user3);
        swagForm.submitForm(0, "user3", "user3@example.com", answers);

        // Verifica le submission
        assertTrue(swagForm.hasSubmitted(0, user2));
        assertTrue(swagForm.hasSubmitted(0, user3));

        SwagForm.Submission memory submission2 = swagForm.getSubmission(
            0,
            user2
        );
        SwagForm.Submission memory submission3 = swagForm.getSubmission(
            0,
            user3
        );

        assertEq(submission2.username, "user2");
        assertEq(submission2.email, "user2@example.com");
        assertEq(submission3.username, "user3");
        assertEq(submission3.email, "user3@example.com");

        // Verifica il contatore delle submission
        (, , , , uint256 totalSubmissions, , ) = swagForm.getForm(0);
        assertEq(totalSubmissions, 2);
    }

    function testOnlyCreatorCanViewAllSubmissions() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        // User1 crea un form
        vm.prank(user1);
        swagForm.createForm(
            "Test Form",
            "Test",
            questions,
            isRequired,
            requiresProof
        );

        // User2 e User3 sottomettono
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";

        vm.prank(user2);
        swagForm.submitForm(0, "user2", "user2@example.com", answers);

        vm.prank(user3);
        swagForm.submitForm(0, "user3", "user3@example.com", answers);

        // User1 (creatore) può vedere tutte le submission
        vm.prank(user1);
        SwagForm.Submission[] memory allSubmissions = swagForm
            .getAllFormSubmissions(0);
        assertEq(allSubmissions.length, 2);

        // User2 non può vedere tutte le submission
        vm.prank(user2);
        vm.expectRevert("Only form creator can perform this action");
        swagForm.getAllFormSubmissions(0);
    }

    function testGetAllFormsIncludesCreators() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        // User1 crea due form
        vm.prank(user1);
        swagForm.createForm(
            "Form 1",
            "Description 1",
            questions,
            isRequired,
            requiresProof
        );

        vm.prank(user2);
        swagForm.createForm(
            "Form 2",
            "Description 2",
            questions,
            isRequired,
            requiresProof
        );

        // Disattiva il secondo form
        vm.prank(user2);
        swagForm.setFormActive(1, false);

        (
            string[] memory titles,
            bool[] memory activeStatus,
            uint256[] memory submissionCounts,
            address[] memory creators
        ) = swagForm.getAllForms();

        assertEq(titles.length, 2);
        assertEq(titles[0], "Form 1");
        assertEq(titles[1], "Form 2");
        assertTrue(activeStatus[0]);
        assertFalse(activeStatus[1]);
        assertEq(submissionCounts[0], 0);
        assertEq(submissionCounts[1], 0);
        assertEq(creators[0], user1);
        assertEq(creators[1], user2);
    }

    function testGetUserStats() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        // User1 crea due form
        vm.prank(user1);
        swagForm.createForm(
            "Form 1",
            "Description 1",
            questions,
            isRequired,
            requiresProof
        );

        vm.prank(user1);
        swagForm.createForm(
            "Form 2",
            "Description 2",
            questions,
            isRequired,
            requiresProof
        );

        // User2 crea un form
        vm.prank(user2);
        swagForm.createForm(
            "Form 3",
            "Description 3",
            questions,
            isRequired,
            requiresProof
        );

        // User2 sottomette ai form di user1
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";

        vm.prank(user2);
        swagForm.submitForm(0, "user2", "user2@example.com", answers);

        vm.prank(user2);
        swagForm.submitForm(1, "user2", "user2@example.com", answers);

        // Verifica statistiche user1
        (uint256 formsCreated1, uint256 formsSubmitted1) = swagForm
            .getUserStats(user1);
        assertEq(formsCreated1, 2);
        assertEq(formsSubmitted1, 0);

        // Verifica statistiche user2
        (uint256 formsCreated2, uint256 formsSubmitted2) = swagForm
            .getUserStats(user2);
        assertEq(formsCreated2, 1);
        assertEq(formsSubmitted2, 2);

        // Verifica statistiche user3
        (uint256 formsCreated3, uint256 formsSubmitted3) = swagForm
            .getUserStats(user3);
        assertEq(formsCreated3, 0);
        assertEq(formsSubmitted3, 0);
    }

    function testCannotSubmitToInactiveForm() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        // User1 crea un form
        vm.prank(user1);
        swagForm.createForm(
            "Test Form",
            "Test",
            questions,
            isRequired,
            requiresProof
        );

        // User1 disattiva il form
        vm.prank(user1);
        swagForm.setFormActive(0, false);

        // User2 prova a sottomettere al form inattivo
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";

        vm.prank(user2);
        vm.expectRevert("Form is not active");
        swagForm.submitForm(0, "user2", "user2@example.com", answers);
    }

    function testCannotSubmitDuplicateEmail() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        vm.prank(user1);
        swagForm.createForm(
            "Test Form",
            "Test",
            questions,
            isRequired,
            requiresProof
        );

        string[] memory answers = new string[](1);
        answers[0] = "Test answer";

        vm.prank(user2);
        swagForm.submitForm(0, "user2", "test@example.com", answers);

        vm.prank(user3);
        vm.expectRevert("Email already registered for this form");
        swagForm.submitForm(0, "user3", "test@example.com", answers);
    }

    function testCannotSubmitTwiceFromSameAddress() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        vm.prank(user1);
        swagForm.createForm(
            "Test Form",
            "Test",
            questions,
            isRequired,
            requiresProof
        );

        string[] memory answers = new string[](1);
        answers[0] = "Test answer";

        vm.prank(user2);
        swagForm.submitForm(0, "user2", "user2@example.com", answers);

        vm.prank(user2);
        vm.expectRevert("Address already submitted to this form");
        swagForm.submitForm(
            0,
            "user2_updated",
            "user2_updated@example.com",
            answers
        );
    }

    function testCanSubmitToMultipleFormsWithSameEmail() public {
        string[] memory questions = new string[](1);
        questions[0] = "Test question?";
        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](1);
        requiresProof[0] = false;

        // User1 crea due form
        vm.prank(user1);
        swagForm.createForm(
            "Form 1",
            "Test 1",
            questions,
            isRequired,
            requiresProof
        );

        vm.prank(user1);
        swagForm.createForm(
            "Form 2",
            "Test 2",
            questions,
            isRequired,
            requiresProof
        );

        // User2 può sottomettere alla stesso email a entrambi i form
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";

        vm.prank(user2);
        swagForm.submitForm(0, "user2", "user2@example.com", answers);

        vm.prank(user2);
        swagForm.submitForm(1, "user2", "user2@example.com", answers);

        assertTrue(swagForm.hasSubmitted(0, user2));
        assertTrue(swagForm.hasSubmitted(1, user2));
    }

    function testFormValidation() public {
        // Titolo vuoto
        vm.expectRevert("Title is required");
        swagForm.createForm(
            "",
            "Description",
            new string[](1),
            new bool[](1),
            new bool[](1)
        );

        // Nessuna domanda
        vm.expectRevert("At least one question is required");
        swagForm.createForm(
            "Title",
            "Description",
            new string[](0),
            new bool[](0),
            new bool[](0)
        );

        // Lunghezza diversa tra domande e flag required
        string[] memory questions = new string[](2);
        questions[0] = "Question 1";
        questions[1] = "Question 2";

        bool[] memory isRequired = new bool[](1);
        isRequired[0] = true;

        bool[] memory requiresProof = new bool[](2);
        requiresProof[0] = false;
        requiresProof[1] = false;

        vm.expectRevert("Questions and required flags must have same length");
        swagForm.createForm(
            "Title",
            "Description",
            questions,
            isRequired,
            requiresProof
        );

        // Test: Lunghezza diversa per requiresProof
        bool[] memory isRequiredCorrect = new bool[](2);
        isRequiredCorrect[0] = true;
        isRequiredCorrect[1] = false;

        bool[] memory requiresProofWrong = new bool[](1);
        requiresProofWrong[0] = false;

        vm.expectRevert("Questions and proof flags must have same length");
        swagForm.createForm(
            "Title",
            "Description",
            questions,
            isRequiredCorrect,
            requiresProofWrong
        );
    }

    function testSubmissionValidation() public {
        string[] memory questions = new string[](2);
        questions[0] = "Required question?";
        questions[1] = "Optional question?";

        bool[] memory isRequired = new bool[](2);
        isRequired[0] = true;
        isRequired[1] = false;

        bool[] memory requiresProof = new bool[](2);
        requiresProof[0] = false;
        requiresProof[1] = false;

        vm.prank(user1);
        swagForm.createForm(
            "Test Form",
            "Test",
            questions,
            isRequired,
            requiresProof
        );

        // Username vuoto
        string[] memory answers = new string[](2);
        answers[0] = "Answer 1";
        answers[1] = "Answer 2";

        vm.prank(user2);
        vm.expectRevert("Username is required");
        swagForm.submitForm(0, "", "user2@example.com", answers);

        // Email vuota
        vm.prank(user2);
        vm.expectRevert("Email is required");
        swagForm.submitForm(0, "user2", "", answers);

        // Numero di risposte errato
        string[] memory wrongAnswers = new string[](1);
        wrongAnswers[0] = "Only one answer";

        vm.prank(user2);
        vm.expectRevert("Answer count must match question count");
        swagForm.submitForm(0, "user2", "user2@example.com", wrongAnswers);

        // Risposta obbligatoria vuota
        string[] memory incompleteAnswers = new string[](2);
        incompleteAnswers[0] = ""; // Vuoto per domanda obbligatoria
        incompleteAnswers[1] = "Optional answer";

        vm.prank(user2);
        vm.expectRevert("Required question not answered");
        swagForm.submitForm(0, "user2", "user2@example.com", incompleteAnswers);
    }

    function testFormExistsModifier() public {
        string[] memory answers = new string[](1);
        answers[0] = "Test answer";

        vm.prank(user1);
        vm.expectRevert("Form does not exist");
        swagForm.submitForm(999, "user1", "user1@example.com", answers);

        vm.prank(user1);
        vm.expectRevert("Form does not exist");
        swagForm.getForm(999);
    }

    function testTwitterProofFunctionality() public {
        string[] memory questions = new string[](3);
        questions[0] = "What is your name?";
        questions[1] = "Share your tweet URL";
        questions[2] = "Any comments?";

        bool[] memory isRequired = new bool[](3);
        isRequired[0] = true;
        isRequired[1] = true;
        isRequired[2] = false;

        bool[] memory requiresProof = new bool[](3);
        requiresProof[0] = false; // Name - no proof
        requiresProof[1] = true; // Tweet URL - requires proof
        requiresProof[2] = false; // Comments - no proof

        // User1 crea un form con requirements di proof
        vm.prank(user1);
        swagForm.createForm(
            "Twitter Proof Form",
            "Form with Twitter verification",
            questions,
            isRequired,
            requiresProof
        );

        // Verifica che i proof requirements siano salvati correttamente
        bool[] memory storedRequirements = swagForm.getProofRequirements(0);
        assertEq(storedRequirements.length, 3);
        assertFalse(storedRequirements[0]); // No proof for name
        assertTrue(storedRequirements[1]); // Proof required for tweet
        assertFalse(storedRequirements[2]); // No proof for comments

        // Verifica che le domande siano salvate correttamente
        SwagForm.Question[] memory formQuestions = swagForm.getFormQuestions(0);
        assertEq(formQuestions.length, 3);
        assertEq(formQuestions[0].questionText, "What is your name?");
        assertFalse(formQuestions[0].requiresProof);
        assertEq(formQuestions[1].questionText, "Share your tweet URL");
        assertTrue(formQuestions[1].requiresProof);
        assertEq(formQuestions[2].questionText, "Any comments?");
        assertFalse(formQuestions[2].requiresProof);

        // Test che inizialmente nessuna proof è verificata
        assertFalse(swagForm.isProofVerified(0, user2, 1));
        assertFalse(swagForm.areAllProofsVerified(0, user2));

        // Simula la verifica di una proof (normalmente sarebbe fatto dal contratto Flare)
        vm.prank(user1); // Solo per testing - in produzione sarebbe il contratto autorizzato
        swagForm.setProofVerified(0, user2, 1, true);

        // Verifica che la proof sia ora marcata come verificata
        assertTrue(swagForm.isProofVerified(0, user2, 1));
        assertTrue(swagForm.areAllProofsVerified(0, user2));
    }
}
