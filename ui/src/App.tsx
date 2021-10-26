import { Container } from '@mui/material';
import { TopBar, TopBarOffset } from './common/AppBar';
import Home from './home/home';
import Config from './host/Config';
import Lobby from './participant/Lobby';

function App() {
    return (
        <Container
            disableGutters
            sx={{
                minHeight: "100vh",
                minWidth: "100vw"
            }}
        >
            <TopBar />
            <TopBarOffset />
            {/* <Home /> */}

            {/* Participants Screens */}
            {/* <Lobby /> */}

            {/* Host Screens */}
            <Config />
        </Container>
    )
}

export default App;
