import {AppBar, Toolbar, Typography} from '@mui/material';
import { styled } from '@mui/material/styles';
import { APP_NAME } from '../const';

interface ITopBarProps {

}

export function TopBar(props: ITopBarProps) {
    return (
        <AppBar position="fixed">
            <Toolbar>
                <Typography variant="h3">{APP_NAME}</Typography>
            </Toolbar>
        </AppBar>
    )
}

// NOTE: This needs to be applied directly below AppBar else following content can appear behind
export const TopBarOffset = styled('div')(({ theme }) => theme.mixins.toolbar);