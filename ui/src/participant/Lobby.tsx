import React from "react";
import { Button, Box, TextField, ListItem, ListItemText, Container, Typography} from "@mui/material";
import ParticipantList from "../common/ParticipantList";

interface IJoinListItemProps {
    listItemKey: string,
    onJoin: (name: string) => void
}

interface IJoinListItemState {
    userJoined: boolean,
    nameField: string,
}

class JoinListItem extends React.Component<IJoinListItemProps, IJoinListItemState> {
    constructor(props: IJoinListItemProps) {
        super(props)
        this.state = {
            userJoined: false,
            nameField: ""
        }

        this.onFieldChange = this.onFieldChange.bind(this)
        this.onJoinClicked = this.onJoinClicked.bind(this)
    }

    private onFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({nameField: event.target.value});
    }

    private onJoinClicked() {
        this.setState({userJoined: true})
        this.props.onJoin(this.state.nameField);
    }

    render() {
        const { listItemKey } = this.props;
        const { nameField } = this.state;

        const content = this.state.userJoined ?
            <ListItemText primary={this.state.nameField} /> :
            <Container
                sx={{
                    display: "flex",
                    alignItems: "baseline"
                }}
            >
                <TextField
                    fullWidth
                    id="outlined-basic"
                    label="name"
                    onChange={this.onFieldChange}
                />
                <Button
                    disabled={!nameField}
                    onClick={() => this.onJoinClicked()}
                    variant="contained"
                    sx={{
                        margin: 2
                    }}
                >JOIN</Button>
            </Container>

        return (
            <ListItem
                key={listItemKey}
                sx={{
                    border: "1px solid green", // TODO: properly style this
                }}
            >
                {content}
            </ListItem>
        )
    }
}

interface ILobbyProps {
    // participants // will add this eventually
}

interface ILobbyState {
    // Whether the user has entered their name and pressed the "JOIN" button
    userJoined: boolean,
    username: string
}

class Lobby extends React.Component<ILobbyProps, ILobbyState> {
    constructor(props: ILobbyProps) {
        super(props)
        this.state = {
            userJoined: false,
            username: ""
        }
        this.onJoin = this.onJoin.bind(this)
    }

    private onJoin(name: string) {
        this.setState({
            userJoined: true,
            username: name
        })
        alert(`'${name}' joined`)
    }

    render() {
        const participants: Set<string> = new Set(Array.from(Array(150).keys()).map(x => `participant ${x}`))

        let joinListItem = <JoinListItem
            listItemKey={"joinListItem"}  // NOTE: probably come up with a better key than this
            onJoin={this.onJoin} 
        />;

        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="center"
                height="100%"
                sx={{
                    overflowY: "auto"
                }}
            >
                <Typography>Waiting for host to start...</Typography>

                <ParticipantList
                    thisParticipant={joinListItem}
                    otherParticipants={participants}
                />
            </Box>
        )
    }
}

export default Lobby;