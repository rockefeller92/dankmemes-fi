import { FC } from 'react';
import { AppProps } from 'next/app';
import Index from './index'
import { ThemeProvider} from 'styled-components'

import theme from '../styles/theme';

import '../styles/main.css';

const App: FC<AppProps> = ({ Component, pageProps }) => {

	return (
		<>
            <ThemeProvider theme={theme}>
                <Index />
            </ThemeProvider>>
        </>
	);
};

export default App;
