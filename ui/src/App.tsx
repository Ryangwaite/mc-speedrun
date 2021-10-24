import { Container } from '@mui/material';
import { TopBar, TopBarOffset } from './common/AppBar';
import Home from './home/home';
import Lobby from './participant/Lobby';

function App() {
    return (
        <Container
            disableGutters
            maxWidth={false}
        >
            <TopBar />
            <TopBarOffset />
            {/* <Home /> */}
            <Lobby />
        </Container>
    )
}

export default App;
