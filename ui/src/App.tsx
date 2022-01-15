import { Box, } from '@mui/material';
import { TopBar } from './components/common/AppBar';
import Home from './pages/Home';
import Config from './pages/Config';
import Summary from './pages/Summary';
import { Route, Routes, } from 'react-router-dom';
import { selectWebsocketConnectionState } from './slices/common';
import { useAppSelector } from './hooks';
import theme from './themes/theme';
import ProtectedElement from './components/ProtectedElement';
import Lobby from './pages/Lobby';
import Quiz from './pages/Quiz';
import NotFound from './pages/NotFound';

function App() {

    const connectionState = useAppSelector(state => selectWebsocketConnectionState(state))

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                height: "100vh",
                width: "100vw",
                backgroundColor: theme.palette.grey[100],
            }}
        >
            <TopBar connectionState={connectionState}/>
            <Routes>
                <Route path="/" element={<Home />} />
                {/* Participants Screens */}
                <Route path="/lobby" element={<ProtectedElement><Lobby /></ProtectedElement>} />
                <Route path="/quiz" element={<ProtectedElement><Quiz /></ProtectedElement>} />
                {/* Host Screens */}
                <Route path="/config" element={<ProtectedElement><Config /></ProtectedElement>} />
                <Route path="/summary" element={<ProtectedElement><Summary /></ProtectedElement>} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Box>
    )
}

export default App;
