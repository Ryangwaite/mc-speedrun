import {AppBar, Toolbar, Typography} from '@mui/material';
import { APP_NAME } from '../../const';

export const APP_BAR_HEIGHT = "48px"//"64px"
interface ITopBarProps {

}

export function TopBar(props: ITopBarProps) {
    return (
        <AppBar
            sx={{
                // Force the appbar to be positioned in the document flow
                position: "static"
            }}
        >
            <Toolbar
                disableGutters={true}
                sx={{
                    padding: 0,
                    margin: 0,
                }}
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