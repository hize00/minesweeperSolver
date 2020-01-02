# **MINE-A-JOY-A MINESWEEPER SOLVER**


***HOW TO RUN***

1) extract the zip
2) open cmd/bash/terminal where the script is located
3) type: python mine_solver.py parameters (read below)

***PARAMETERS***

The script takes as input 4 parameters:
1) board width
2) board height
3) number of mines
4) boolean to display the GUI

example: python mine_solver.py 16 16 40 False

***EXECUTION***

The script will generate a feasible board with the input parameters specified. The algorithm will then try to solve it by iteratively applying deterministic choices, and random clicks only if it is not appliable any deterministic choice.
It will also write all the steps and calculations computed in a folder named "logs" that will be created in the same path in which the python script is located.
The algorithm might not be always able to solve the board, especially if it is out of deterministic choices and must use a random move. If the algorithm loses by clicking a random cell it is considered bad luck :)

***NOTES***

Right now the GUI is really basic and work in progress, not thought as the core part of the project. Probably the library used (tkinter) is not the right tool in this case. That's why the project will be probably translated into Javascript when I will have time and will :)
In addition, if the grid is too big (30x16) the GUI stream might crash (...ooops :-) ). If you want to use the GUI create a board up to 16x16. Right now with bigger boards the GUI might crash.
Obviously, as you will notice, the algorithm performance is much better without the GUI.
For example, without GUI, the algorithm solved a 30x16 board with 99 mines in 0.45303869247436523 seconds

***HOW TO HELP***

The algorithm should be stable. If you want to help me in debugging it, run it different times and note down if it loses by NOT clicking a random cell. This would mean there is something wrong in the calculations applied.
If the algorithm loses by clicking a random cell it's ok.
The algorithm will also writes the computations to the standard output (cmd/bash/terminal) so it is easy to see what the last move was.



***THANK YOU***

Carlo
