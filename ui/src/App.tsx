import { Box } from '@mui/material';
import { TopBar } from './components/common/AppBar';
import Home from './components/home/home';
import Config from './components/host/Config';
import Summary from './components/common/Summary';

import Lobby from './components/participant/Lobby';
import Quiz from './components/participant/Quiz';
import { Route, Routes } from 'react-router-dom';

function App() {

    // Todo initialize websocket connection here passing in the dispatch method above

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="stretch"
            sx={{
                height: "100vh",
                width: "100vw",
                border: "1px solid blue"
            }}
        >
            <TopBar />
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
