import {AppBar, Toolbar, Typography} from '@mui/material';
import { APP_NAME } from '../const';

export const APP_BAR_HEIGHT = "48px"//"64px"
interface ITopBarProps {

}

export function TopBar(props: ITopBarProps) {
    return (
        <AppBar
            position="fixed"
            sx={{
                // Truncate the appbar text if it overflows on small screens
                overflow: "hidden",
                height: APP_BAR_HEIGHT
            }}
        >
            <Toolbar
                disableGutters={true}
            >
                <Typography
                    variant="h1"
                    sx={{
                        fontSize: {
                            xs: "1.5rem",
                            sm: "2.0rem"
                        }
                    }}
                >{APP_NAME}</Typography>
            </Toolbar>
        </AppBar>
    )
}

// NOTE: This needs to be applied directly below AppBar else following content can appear behind
export const TopBarOffset = () => <Toolbar sx={{height: APP_BAR_HEIGHT}}></Toolbar>