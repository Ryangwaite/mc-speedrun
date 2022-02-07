package logfmt

import (
	log "github.com/sirupsen/logrus"
)

// Logger which replaces the datetime with one for UTC before passing it through to the underlying
// formatter
type utcLogFormatter struct  {
	formatter  log.Formatter
}

// Switch the timezone of the log time to UTC before passing to the
// formatter
func (f utcLogFormatter) Format(e *log.Entry) ([]byte, error) {
	e.Time = e.Time.UTC()
	return f.formatter.Format(e)
}

func NewUtcLogFormatter() utcLogFormatter {	
	return utcLogFormatter {
		formatter: &log.TextFormatter{
			FullTimestamp: true,
			TimestampFormat: "2006-01-02 15:04:05.000",
		},
	}
}