import axios, { AxiosError, AxiosResponse } from 'axios';
import { useState, useEffect } from 'react';
import UserFeedDisplay from './UserFeedDisplay.tsx'
import UserPost from './UserPost.tsx'


type FormData = {
    username: string;
    content: string;
    image: File | null;
};

interface Post {
    post_id: number;
    user_id: number;
    content: string;
    image: Blob | null; 
}

interface Comment {
    comment_id: number;
    post_id: number;
    user_id: number;
    parent_comment_id: number | null; 
    content: string;
    time: string; 
}

function UserFeed() {
    const [formData, setFormData] = useState<FormData>({
        username: "",
        content: "",
        image: null,
    });
    
    const [isDisplay, setIsDisplay] = useState<boolean>(false);

    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    // useEffect(() => {
    //     (async () => {
    //         try {
    //             const userPostsResponse = await axios.get<Post[]>("/api/userPosts");
    //             const postCommentsResponse = await axios.get<Comment[]>("/api/postComments");
    //             console.log(userPostsResponse.data);
    //             console.log(postCommentsResponse.data);
    //             setPosts(userPostsResponse.data);
    //             setComments(postCommentsResponse.data);
    //         } catch (err) {
    //             const error = err as AxiosError<any>;
    //             console.log(error?.response?.data?.error);
    //         }
    //     })();
    // }, []);

    const handleNewPostClick = async () => {

        try {
            //console.log(`user`)
            //console.log(`Image: `);
            const response = await axios.post("/api/userPosts", formData);
            console.log(response.data.message);
        } catch (err) {
            const error = err as AxiosError<any>;
            console.log(error?.response?.data?.error);
        }
        
        

    }

    const handleGetPosts = async () => {
        const userPostsResponse = await axios.get<{message: Post[]}>("/api/userPosts");
        console.log(userPostsResponse.data);            
    }
    const handleGetComments = async () => {
        const postCommentsResponse = await axios.get<{message: Comment[]}>("/api/postComments");
        console.log(postCommentsResponse.data);
    }

    const handleGetFeed = async () => {
        const userPostsResponse = await axios.get<{message: Post[]}>("/api/userPosts");
        setPosts(userPostsResponse.data.message);

        const postCommentsResponse = await axios.get<{message: Comment[]}>("/api/postComments");
        setComments(postCommentsResponse.data.message);

        setIsDisplay(true);
    }
    
    return (
    <>
        <button onClick={handleGetPosts}>Click here for Posts</button>
        <button onClick={handleGetComments}>Click here for Comments</button>
        <button onClick={handleGetFeed}>Click here to Display Feed</button>
        {
            isDisplay && <div className="post-container">
            {
                posts.map(post => (
                    <div key={post.post_id} className="post">
                        <div className="post-content">
                            <h3>PostID: {post.post_id}</h3>
                            <p>{post.content}</p>
                            {/* {post.image && <img src={post.image} alt="Post Image" />} */}
                        </div>
                        <div className="comments">
                        <h3>Comments</h3>
                            {comments.filter(comment => comment.post_id === post.post_id)
                                    .map(filteredComment => (
                                        <div key={filteredComment.comment_id} className="comment">
                                            <p>{filteredComment.content}</p>
                                            <span>Posted by: {filteredComment.user_id}</span>
                                            <span>Time: {filteredComment.time}</span>
                                        </div>
                                    ))}
                        </div>
                        </div>
                ))
            }
        </div>
        }

        <div 
            id="user-post-form"
        >
            <label 
                htmlFor="username"
            >
                    Username:
            </label>

            <input 
                type="text" 
                id="username" 
                name="username"
                value={formData.username}
                onChange={
                    (e) => setFormData({...formData, username: e.target.value})
                }
            >
            </input>
            <br/>

            <label 
                htmlFor="postContent"
            >
                Post Content:
            </label>

            <textarea 
                id="postContent" 
                name="postContent"
                value={formData.content} 
                rows={4} 
                cols={50}
                onChange={
                    (e) => setFormData({...formData, content: e.target.value})
                }
            >
            </textarea>

            <br/>

            <label htmlFor="image">Image:</label>
                <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*" // Allow only image files
                    onChange={
                        (e) => {
                            if (e.target.files !== null) {
                                setFormData(
                                    { ...formData, 
                                      image: e.target.files[0]
                                    }
                                );
                                console.log(e.target.files[0]);
                            }
                            
                        
                        //console.log(e.target.files);
                    }
                    }
                />
                <br />
            <button onClick={handleNewPostClick}>
                Sumbit Post
            </button>

        </div>
        
        <div id="display-feed">

            <UserFeedDisplay />
        </div>
        
        <form action="/profile" method="post" encType="multipart/form-data">
            <input type="file" name="avatar" />
            <br/>
            <button 
            type="submit"
            >
                Submit
            </button>
        </form>
        
    </>
    );
}

export default UserFeed;