import { useState } from "react";
import axios, { AxiosError, AxiosResponse } from 'axios';

const UserFeedDisplay = () => {
    const [isDisplayMode, setIsDisplayMode] = useState<boolean>(false);
    const [feed, setFeed] = useState();

    const handleDisplayClick = async () => {
        
        try {
            const response = await axios.get("/api/userPosts");
            setIsDisplayMode(true);
            console.log(response.data);
            setFeed(response.data);
        } catch (err) {
            const error = err as AxiosError<any>;
            console.log(error?.response?.data?.error);
        }
        
    };
    return (
        <>
            <button onClick={handleDisplayClick}>
                Display All Posts
            </button>

            <div>
                {
                    isDisplayMode && <div></div>
                }
            </div>


        </>
    );
}

export default UserFeedDisplay;