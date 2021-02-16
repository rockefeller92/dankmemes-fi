import { FC } from 'react';
import { AppProps } from 'next/app';
import Index from './index'
import { ThemeProvider} from 'styled-components'
import { Provider as AlertProvider, positions } from "react-alert";

 //no types for this module
//@ts-ignore
import AlertTemplate from "../components/AlertTemplate";

import theme from '../styles/theme';

import '../styles/main.css';

const App: FC<AppProps> = ({ Component, pageProps }) => {

	return (
		<>
            <ThemeProvider theme={theme}>
			<AlertProvider template={AlertTemplate} {...{position:positions.TOP_CENTER}}>
                <Index />
			</AlertProvider>
            </ThemeProvider>
        </>
	);
};

export default App;
