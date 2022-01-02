import { Box } from '@mui/material';
import { TopBar } from './components/common/AppBar';
import Home from './components/home/home';
import Config from './components/host/Config';
import Summary from './components/common/Summary';

import Lobby from './components/participant/Lobby';
import Quiz from './components/participant/Quiz';
import { Route, Routes } from 'react-router-dom';
import { selectWebsocketConnectionState } from './slices/common';
import { useAppSelector } from './hooks';
import theme from './themes/theme';

function App() {

    const connectionState = useAppSelector(state => selectWebsocketConnectionState(state))

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="stretch"
            sx={{
                height: "100vh",
                width: "100vw",
                backgroundColor: theme.palette.grey[100],
            }}
        >
            <TopBar connectionState={connectionState}/>
            <Routes>
                <Route path="/" element={<Home />} />
                {/* Participants Screens */}
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/quiz" element={<Quiz />} />
                {/* Host Screens */}
                <Route path="/config" element={<Config />} />
                <Route path="/summary" element={<Summary />} />
            </Routes>
        </Box>
    )
}

export default App;
