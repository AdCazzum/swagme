import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';

const CONTRACT_ADDRESS = '0xf69C5b8C35bA1bD610Fc2a587ff4633CcAD0e109';

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
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "_questions",
        "type": "string[]"
      },
      {
        "internalType": "bool[]",
        "name": "_isRequired",
        "type": "bool[]"
      }
    ],
    "name": "createForm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "emailExists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "formSubmitters",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "forms",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "totalSubmissions",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      }
    ],
    "name": "getAllFormSubmissions",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "formId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "username",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "email",
            "type": "string"
          },
          {
            "internalType": "string[]",
            "name": "answers",
            "type": "string[]"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "submitter",
            "type": "address"
          }
        ],
        "internalType": "struct SwagForm.Submission[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllForms",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "titles",
        "type": "string[]"
      },
      {
        "internalType": "bool[]",
        "name": "activeStatus",
        "type": "bool[]"
      },
      {
        "internalType": "uint256[]",
        "name": "submissionCounts",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "creators",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      }
    ],
    "name": "getForm",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "questionsCount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "totalSubmissions",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      }
    ],
    "name": "getFormQuestions",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "questionText",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "isRequired",
            "type": "bool"
          }
        ],
        "internalType": "struct SwagForm.Question[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      }
    ],
    "name": "getFormSubmitters",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalFormsCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalSubmissionsCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getSubmission",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "formId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "username",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "email",
            "type": "string"
          },
          {
            "internalType": "string[]",
            "name": "answers",
            "type": "string[]"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "submitter",
            "type": "address"
          }
        ],
        "internalType": "struct SwagForm.Submission",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserForms",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "formsCreated",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "formsSubmitted",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "hasSubmitted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "isFormCreator",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_active",
        "type": "bool"
      }
    ],
    "name": "setFormActive",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "submissions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "formId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "submitter",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_username",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_email",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "_answers",
        "type": "string[]"
      }
    ],
    "name": "submitForm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalForms",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSubmissions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      }
    ],
    "name": "updateFormDescription",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_formId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      }
    ],
    "name": "updateFormTitle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userForms",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export interface Question {
  questionText: string;
  isRequired: boolean;
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
    }
  }, [signer]);

  const createForm = async (
    title: string,
    description: string,
    questions: { text: string; required: boolean }[]
  ) => {
    if (!contract) {
      throw new Error('Contract not available');
    }

    setLoading(true);
    try {
      const questionTexts = questions.map(q => q.text);
      const requiredFlags = questions.map(q => q.required);

      console.log('Creating form with:', { title, description, questionTexts, requiredFlags });
      console.log('Contract address being used:', CONTRACT_ADDRESS);
      console.log('Account creating form:', account);
      
      const tx = await contract.createForm(title, description, questionTexts, requiredFlags);
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
      console.log('Calling getAllForms on contract...');
      const [titles, activeStatus, submissionCounts, creators] = await contract.getAllForms();
      
      console.log('getAllForms raw data:', {
        titles,
        activeStatus,
        submissionCounts,
        creators,
        titlesLength: titles.length
      });
      
      const forms: FormData[] = [];
      for (let i = 0; i < titles.length; i++) {
        console.log(`Processing form ${i}:`, titles[i]);
        
        try {
          const formDetails = await contract.getForm(i);
          const questions = await contract.getFormQuestions(i);
          
          console.log(`Form ${i} details:`, formDetails);
          console.log(`Form ${i} questions:`, questions);
          
          forms.push({
            id: i,
            title: titles[i],
            description: formDetails.description,
            questions: questions,
            isActive: activeStatus[i],
            totalSubmissions: Number(submissionCounts[i]),
            createdAt: Number(formDetails.createdAt),
            creator: creators[i],
          });
        } catch (error) {
          console.error(`Error fetching details for form ${i}:`, error);
        }
      }
      
      console.log('Final forms array:', forms);
      return forms;
    } catch (error) {
      console.error('Error fetching forms:', error);
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
      const [totalForms, totalSubmissions] = await contract.getStats();
      return {
        totalForms: Number(totalForms),
        totalSubmissions: Number(totalSubmissions),
      };
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
  };
};
