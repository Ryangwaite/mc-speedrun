import { Container, Box } from '@mui/material';
import { TopBar } from './common/AppBar';
import Home from './home/home';
import Config from './host/Config';
import Observe from './host/Observe';

import Lobby from './participant/Lobby';
import Quiz from './participant/Quiz';

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
            {/* <Home /> */}

            {/* Participants Screens */}
            {/* <Lobby /> */}
            {/* <Quiz /> */}

            {/* Host Screens */}
            {/* <Config /> */}
            <Observe />
        </Box>
    )
}

export default App;
