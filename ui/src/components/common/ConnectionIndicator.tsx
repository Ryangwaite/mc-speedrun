import { WebsocketConnectionStateType } from '../../api/websocket';
import CircleIcon from '@mui/icons-material/Circle';
import { Stack, Typography } from '@mui/material';

interface IConnectionIndicatorProps {
    connectionState: WebsocketConnectionStateType,
}

export function ConnectionIndicator({connectionState}: IConnectionIndicatorProps) {
    
    let text
    let color
    switch (connectionState) {
        case WebsocketConnectionStateType.UNINITIALIZED:
            return null // dont display anything
        case WebsocketConnectionStateType.CONNECTING:
            text = "Connecting..."    
            color = "orange"
            break
        case WebsocketConnectionStateType.CONNECTED:
            text = "Connected"
            color = "green"
            break
        case WebsocketConnectionStateType.DISCONNECTED:
            text = "Disconnected"
            color = "red"
            break
        case WebsocketConnectionStateType.RECONNECTING:
            text = "Reconnecting..."
            color = "orange"
            break
        default:
            throw new Error(`Unexpected websocket connection state: '${connectionState}'`)
    }
    
    return (
        <Stack direction="row">
            <CircleIcon
                htmlColor={color}
                sx={{
                    margin: "4px",
                }}
            />
            <Typography variant="body1" margin="4px" marginRight="12px">{text}</Typography>
        </Stack>
    )
}