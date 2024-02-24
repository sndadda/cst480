import { useState, useEffect } from "react";
import axios, { AxiosError, AxiosResponse } from 'axios';

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
interface UserPostProps {
    posts: Post[];
    comments: Comment[];
}
const UserPost = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    useEffect(() => {
        (async () => {
            try {
                const userPostsResponse = await axios.get<Post[]>("/api/userPosts");
                const postCommentsResponse = await axios.get<Comment[]>("/api/postComments");
                console.log(userPostsResponse);
                console.log(postCommentsResponse);
                setPosts(userPostsResponse.data);
                setComments(postCommentsResponse.data);
            } catch (err) {
                const error = err as AxiosError<any>;
                console.log(error?.response?.data?.error);
            }
        })();
    }, []);

    // const handleClick = async () => {
    //     try {
    //         const userPostsResponse = await axios.get<Post[]>("/api/userPosts");
    //         const postCommentsResponse = await axios.get<Comment[]>("/api/postComments");
    //         console.log(userPostsResponse);
    //         console.log(postCommentsResponse);
    //         setPosts(userPostsResponse.data);
    //         setComments(postCommentsResponse.data);
    //         console.log("Clicked display.")
    //     } catch (err) {
    //         const error = err as AxiosError<any>;
    //         console.log(error?.response?.data?.error);
    //     }
    // }

    return (
        <>
            {/* {<button onClick={handleClick}>Click here for display the feed</button>*/}
            <div className="post-container">
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
        </>
    );
}

export default UserPost;