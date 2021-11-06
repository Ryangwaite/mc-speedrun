import { Container, Typography } from "@mui/material";
import React from "react";
import { LeaderboardColumn } from "../common/Leaderboard";

interface IObserveProps {
}

interface IObserveState {
    
}

class Observe extends React.Component<IObserveProps, IObserveState> {
    constructor(props: IObserveProps) {
        super(props)
        this.state = {}
    }

    render() {
        return <LeaderboardColumn />
    }
}

export default Observe;