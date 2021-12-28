import { Button, Card, CardActions, CardHeader, TextField } from "@mui/material";
import { useState } from "react";

interface ITextButtonCardProps {
    title: string,
    label: string,
    buttonLabel: string,
    onSubmit: (inputContent: string) => void
}

function TextButtonCard(props: ITextButtonCardProps) {

    const { title, label, buttonLabel, onSubmit} = props

    const [fieldContent, setFieldContent] = useState("")

    function onFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        console.debug(`Field has updated to '${value}'`)
        setFieldContent(value)
    }

    function onKeyDown(event: React.KeyboardEvent) {
        if ((event.code === "Enter" || event.code === "NumpadEnter") && fieldContent) {
            event.preventDefault()
            onSubmit(fieldContent)
        }
    }
    
    return (
        <Card sx={{
            width: 320,
        }}>
            <CardHeader title={title} sx={{ textAlign: "center" }} />
            <CardActions
                sx={{
                    height: 80
                }}
            >
                <TextField
                    id="outlined-basic"
                    label={label}
                    onChange={onFieldChange}
                    onKeyDown={onKeyDown}
                    sx={{
                        marginRight: 1
                    }}
                />
                <Button
                    disabled={!fieldContent}
                    onClick={() => onSubmit(fieldContent)}
                    variant="contained" 
                >{buttonLabel}</Button>
            </CardActions>
        </Card>
    )
}

export default TextButtonCard