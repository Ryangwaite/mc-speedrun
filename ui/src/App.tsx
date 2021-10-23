import { Container } from '@mui/material';
import { TopBar, TopBarOffset } from './common/AppBar';
import Home from './home/home';

function App() {
    return (
        <Container
            disableGutters
            maxWidth={false}
        >
            <TopBar />
            <TopBarOffset />
            <Home />
        </Container>
    )
}

export default App;
