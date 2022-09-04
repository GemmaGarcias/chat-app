import '../styles/globals.css'
import { Amplify, Auth } from 'aws-amplify';
import awsmobile from '../aws-exports';
Amplify.configure({...awsmobile, ssr: true });
import '@aws-amplify/ui-react/styles.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
