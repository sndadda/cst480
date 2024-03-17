import { useState, useRef } from 'react';
import axios from 'axios';
import Avatar from '@mui/material/Avatar';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import './Profile.css';

function Profile() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileSelectedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files ? event.target.files[0] : null);

    // Read the file and set the result to imageURL
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageURL(event.target?.result as string);
      };
      reader.readAsDataURL(event.target.files[0]);
    }

    // Upload the file immediately after it is selected
    //fileUploadHandler(event.target.files ? event.target.files[0] : null);
  };



  const handleEditClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="profile-background">
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={fileSelectedHandler} />
      <div className="avatar-container" onClick={handleEditClick}>
        <Avatar src={imageURL || ''} />
        <div className="edit-icon">
          <IconButton>
            <EditIcon />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export default Profile;