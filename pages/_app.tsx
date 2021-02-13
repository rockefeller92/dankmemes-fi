import { FC } from 'react';
import { AppProps } from 'next/app';
import Index from './index'

import '../styles/main.css';

const App: FC<AppProps> = ({ Component, pageProps }) => {

	return (
		<>
            <Index />
        </>
	);
};

export default App;
