import { LoadingButton } from "@mui/lab"
import { Box, Button, Modal, Stack, Typography } from "@mui/material"
import { useRef, useState } from "react"
import theme from "../../themes/theme"

interface IUploadModalProps {
    open: boolean,
    onUpload: (file: File) => Promise<void>,
    // Show an error on the dialog. This will only arise if validation of the previously
    // uploaded file failed.
    uploadErrMsg?: string,
}

function UploadModal(props: IUploadModalProps): JSX.Element {

    const fileInput = useRef<HTMLInputElement>(null)
    const [fileSelected, setFileSelected] = useState(false)
    const [selectedFileName, setSelectedFileName] = useState<string>()
    const [isUploading, setIsUploading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUploading(true)
        if (fileInput.current != null) {
            const files = fileInput.current.files!
            await props.onUpload(files[0])
            setFileSelected(false)
            if (fileInput.current) {
                // clear the form element. This is needed in case of errors uploading which gets displayed
                // via the uploadErrMsg prop
                fileInput.current.value = ""
            }
        }
        setIsUploading(false)
    }

    const handleFileSelected = () => {
        setFileSelected(true)
        const fileName = fileInput.current!.files![0]!.name
        setSelectedFileName(fileName)
    }

    const uploadErrMsgComponent = !fileSelected && props.uploadErrMsg
        ? <Typography color="red" variant="caption" marginBottom={3}>{props.uploadErrMsg}</Typography>
        : undefined

    const fileInputId = "upload-quiz-input"

    return (
        <Modal
            open={props.open}
        >
            <Box
                sx={{
                    // Position in the centre of the window
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: 'translate(-50%, -50%)',
                    width: theme.spacing(50),
                    backgroundColor: theme.palette.grey[100],
                    borderRadius: 5,
                    padding: "24px",
                    boxShadow: theme.shadows[10],
                }}
            >
                <Typography
                    variant="h4"
                    textAlign="center"
                    padding={0}
                    marginBottom={3}
                >Upload Quiz</Typography>
                <form onSubmit={handleSubmit}>
                    <Stack
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Stack
                            direction={"row"}
                            alignItems={"center"}
                            padding={1.5}
                            marginBottom={3}
                            sx={{
                                backgroundColor: "white",
                                borderRadius: 5,
                            }}
                        >
                            <input
                                id={fileInputId}
                                type="file"
                                ref={fileInput}
                                onInput={handleFileSelected}
                                style={{
                                    display: "none",
                                }}
                            />
                            <label
                                htmlFor={fileInputId}
                            >
                                <Button
                                    component="span"
                                >Choose</Button>
                            </label>
                            <Typography
                                color={fileSelected ? theme.palette.grey[900] : theme.palette.grey[500]}
                            >{fileSelected ? selectedFileName! : "No file selected"}</Typography>
                        </Stack>
                        {uploadErrMsgComponent}
                        <LoadingButton
                            type="submit"
                            disabled={!fileSelected}
                            loading={isUploading}
                            variant="contained"
                        >Upload</LoadingButton>
                    </Stack>
                </form>
            </Box>
        </Modal>
    )
}

export default UploadModal