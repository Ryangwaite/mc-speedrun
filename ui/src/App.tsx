import { Container, Box } from '@mui/material';
import { TopBar } from './common/AppBar';
import Home from './home/home';
import Config from './host/Config';
import Summary from './common/Summary';

import Lobby from './participant/Lobby';
import Quiz from './participant/Quiz';
import { Route, Routes } from 'react-router-dom';

function App() {
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
