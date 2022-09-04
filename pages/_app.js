import '../styles/globals.css'
import { Amplify, Auth } from 'aws-amplify';
import awsconfig from '../aws-exports';
Amplify.configure({...awsconfig, ssr: true });
import '@aws-amplify/ui-react/styles.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
