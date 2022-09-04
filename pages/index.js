import styles from "../styles/Home.module.css";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { API, Auth, graphqlOperation, withSSRContext } from "aws-amplify";
import { useEffect, useState } from "react";
import Message from "../components/message";
import { onCreateMessage } from "../src/graphql/subscriptions";
import { listMessages } from "../src/graphql/queries";
import { createMessage } from "../src/graphql/mutations";

function Home({ messages }) {
  const [stateMessages, setStateMessages] = useState([...messages]);
  const [messageText, setMessageText] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log(stateMessages, "hols primera vez");
    const fetchUser = async () => {
      try {
        const amplifyUser = await Auth.currentAuthenticatedUser();
        setUser(amplifyUser);
      } catch (error) {
        setUser(null);
      }
    };
    fetchUser();

    //Subscribe to creation of message
    const subscription = API.graphql(
      graphqlOperation(onCreateMessage)
    ).subscribe({
      next: ({ provider, value }) => {
        setStateMessages(stateMessages => [
          ...stateMessages,
          value.data.onCreateMessage
        ]);
      },
      error: error => console.warn(error)
    });
  }, []);

  useEffect(() => {
    async function getMessages() {
      try {
        const messagesReq = await API.graphql({
          query: listMessages,
          authMode: "AMAZON_COGNITO_USER_POOLS"
        });
        setStateMessages([...messagesReq.data.listMessages.items]);
      } catch (error) {
        console.error(error);
      }
    }
    getMessages();
  }, [user]);

  const handleSubmit = async event => {
    event.preventDefault();

    setMessageText("");

    const input = {
      message: messageText,
      owner: user.username
    };

    try {
      await API.graphql({
        authMode: "AMAZON_COGNITO_USER_POOLS",
        query: createMessage,
        variables: {
          input: input
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (user) {
    return (
      <div className={styles.background}>
        <div className={styles.container}>
          <h1 className={styles.title}> AWS Amplify Live Chat</h1>
          <div className={styles.chatbox}>
            {stateMessages
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map(message => (
                <Message
                  message={message}
                  user={user}
                  key={message.id}
                  isMe={user.username === message.owner}
                />
              ))}
          </div>
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.formBase}>
              <input
                type="text"
                id="message"
                name="message"
                autoFocus
                required
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="💬 Send a message to the world 🌎"
                className={styles.textBox}
              />
              <button style={{ marginLeft: "8px" }}>Send</button>
            </form>
          </div>
        </div>
      </div>
    );
  } else {
    return <p>Loading...</p>;
  }
}

export default withAuthenticator(Home);

export async function getServerSideProps({ req }) {
  // Wrap the request in a withSSRContext to use Amplify functionality serverside.
  const SSR = withSSRContext({ req });

  try {
    // currentAuthenticatedUser() will throw an error if the user is not signed in.
    const user = await SRR.Auth.currentAuthenticatedUser();

    // if we make it passed the above line, that means the user is signed in.
    const response = await SSR.API.graphql({
      query: listMessages,
      // use authMode: AMAZON_COGNITO_USER_POOLS to make a request on the current user's behalf.
      authMode: "AMAZON_COGNITO_USER_POOLS"
    });
    // return all the messages from the dynamoDB.
    return {
      props: {
        messages: response.data.listMessages.items
      }
    };
  } catch (error) {
    // We will end up here if there is no user signed in.
    // We'll just return a list of empty messages.
    return {
      props: {
        messages: []
      }
    };
  }
}
