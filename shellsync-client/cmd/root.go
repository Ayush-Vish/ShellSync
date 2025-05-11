package cmd

import (
	"fmt"
	"os"

	"github.com/common-nighthawk/go-figure"
	"github.com/spf13/cobra"
)

var host string
var port int

var rootCmd = &cobra.Command{
	Use:   "shellsync",
	Short: "ShellSync is a collaborative playground for terminals",
	Long:  `ShellSync is a collaborative playground for terminals.`,
	Run: func(cmd *cobra.Command, args []string) {
		myFigure := figure.NewFigure("ShellSync", "doom", true)
		myFigure.Print()
	},
}

func init() {
	rootCmd.PersistentFlags().StringVar(&host, "host", "localhost", "Host to connect to")
	rootCmd.PersistentFlags().IntVar(&port, "port", 2222, "Port to connect to")

}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
