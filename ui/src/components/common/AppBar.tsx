import {AppBar, Toolbar, Typography} from '@mui/material';
import { WebsocketConnectionStateType } from '../../api/websocket';
import { APP_NAME } from '../../const';
import { ConnectionIndicator } from './ConnectionIndicator';

export const APP_BAR_HEIGHT = "48px"//"64px"
interface ITopBarProps {
    connectionState: WebsocketConnectionStateType,
}

export function TopBar({connectionState}: ITopBarProps) {
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
                        },
                        flexGrow: 1, // push the connection state to the right
                    }}
                >{APP_NAME}</Typography>
                <ConnectionIndicator connectionState={connectionState} />
            </Toolbar>
        </AppBar>
    )
}