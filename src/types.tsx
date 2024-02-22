
export interface UserDetails {
    name: string;
    email:string;
    role:string
  }

 export interface ModalDetails {
    displayName: string;
    uid: string;
    email: string
    // Add other properties as needed
  }
  
 export interface AddModalState {
    isOpen: boolean;
    details: ModalDetails;
  }
  export interface Employee {
    uid: string;
    email: string;
    displayName: string;
    role: string;
  }
  export interface IntakeFiles {
    file_name: string;
    total_pages: string;
    url: string;
    file_id: string
  }