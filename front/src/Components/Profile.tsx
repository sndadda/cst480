import { useState, useRef, useEffect } from 'react';
import { socket } from "../socket.tsx";
import SOCKET_EVENTS from "../socketEnums.ts";
import Avatar from '@mui/material/Avatar';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import './Profile.css';

function Profile() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    socket.connect();

    socket.emit(SOCKET_EVENTS.FETCH_PROFILE_PICTURE);

    socket.on(SOCKET_EVENTS.PROFILE_PIC_FETCHED, (data) => {
      setImageURL(data.image);
    });

  }, []);

  const handleEditClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageURL(reader.result as string);
        // Convert the image to a base64 string
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          socket.emit(SOCKET_EVENTS.UPLOAD_PROFILE_PICTURE, { image: reader.result });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-background">
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
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