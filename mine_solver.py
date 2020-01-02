import random
import sys
import os
import time
from datetime import datetime
import tkinter as Tk
import tkinter.font

__author__ = "Carlo Leone Fanton"
__copyright__ = "open source"
__credits__ = []
__license__ = "open source"
__version__ = "0.0.0"
__email__ = "carlo.fanton92@gmail.com"
__status__ = "work in progress"


"""
=====================================================================================
CLASSES
=====================================================================================
"""


# GUI CLASS
class GUI(Tk.Frame):

    def __init__(self, parent):
        Tk.Frame.__init__(self, parent)
        self.parent = parent
        self.master.title("MINE-A-JOY-A")

    def show_grid(self, grid, description):
        # Draw the GUI
        helv12 = Tk.font.Font(family='Helvetica', size=12, weight='bold')
        helv12_bold = Tk.font.Font(family='Helvetica', size=12, weight='bold')
        roboto15 = Tk.font.Font(family='Roboto', size=15)

        color_dictionary = {
            "1": "blue",
            "2": "green",
            "3": "violet",
            "4": "chocolate",
            "5": "brown",
            "6": "yellow",
            "7": "cyan",
            "8": "darkmagenta",
            "x": "dimgrey",
            "B": "crimson"
        }

        self.frameTop = Tk.Frame(self.parent)
        self.frameTop.pack(fill=Tk.X)
        self.frameTop.configure(bg="black")
        self.frameGrid = Tk.Frame(self.parent)
        self.frameGrid.pack(fill=Tk.X)

        label_top = Tk.Label(self.frameTop, text="MINE-A-JOY-A SOLVER IS COMPUTING...", font=roboto15, borderwidth=2,
                             bg="black", fg="gold")
        label_top.pack(side=Tk.TOP, padx=5, pady=15)
        label_mossa = Tk.Label(self.frameTop, text=description, bg="black", fg="red", font=helv12)
        label_mossa.pack(side=Tk.TOP, padx=5, pady=5)
        #self.mineLbl = Tk.Label(self.frameTop, text="numero bombe", bg="black", fg="blue", font=helv12_bold)
        #self.mineLbl.pack(side=Tk.LEFT, padx=5, pady=5)
        #self.timeLbl = Tk.Label(self.frameTop, text="ganggang", bg="black", fg="green", font=helv12_bold)
        #self.timeLbl.pack(side=Tk.RIGHT, padx=5, pady=5)

        # Create matrix
        w = len(grid[0])
        h = len(grid)
        # self.a = [[0 for y in range(w)] for x in range(h)]
        for i in range(h):
            for j in range(w):
                color = color_dictionary.get(str(grid[i][j].value), "black")
                self.b = Tk.Button(self.frameGrid, text=str(grid[i][j].value), foreground=color, font=helv12_bold)
                self.b.grid(row=i, column=j, sticky="ew")

    def clear_frame(self):
        self.frameGrid.forget()
        self.frameTop.forget()


# CELL CLASS
class Cell:

    def __init__(self, x, y, value, bombs, isKnown, isBomb, isNull, cell_id):
        """
        :param x: x coordinates of CELL on the grid
        :param y: y coordinates of CELL on the grid
        :param value: number of adjacent bombs of CELL
        :param bombs: number of adjacent bomb flags of CELL
        :param isKnown: bool indicating if the cell has been already clicked or it is free
        :param isBomb: bool indicating if the cell is a bomb
        :param isNull: bool indicating if the cell is null = not a bomb nor clickable
        :param cell_id:
        """
        self.x = x
        self.y = y
        self.value = value
        self.bombs = bombs
        self.isKnown = isKnown
        self.isBomb = isBomb
        self.isNull = isNull
        self.cell_id = cell_id


"""
=====================================================================================
GLOBAL VARIABLES
=====================================================================================
"""

# create log folder and file
script_path = os.path.realpath(__file__)
script_name = os.path.basename(__file__)
log_folder = script_path.replace(script_name, "") + "\logs"
if not os.path.exists(log_folder):
    os.makedirs(log_folder)
str_date = datetime.today().strftime('%Y-%m-%d').replace("-", "")
str_time = datetime.now().strftime("%H:%M:%S").replace(":", "")
date_time = str_date + "_" + str_time
log_filepath = log_folder + "/" + "mineLog" + "_" + date_time + ".txt"

# erase log file content
f = open(log_filepath, 'w')
f.close()
file = open(log_filepath, "w+")

# GLOBAL VARS
root = Tk.Tk()
app = GUI(root)
refresh_frequency = 0.05
sleep_gui_time = 10
if len(sys.argv) != 5:
    print("\nWRONG SCRIPT INVOCATION \n" +
          "Argument Usage:\n" +
          "[0] - script name\n" +
          "[1] - Grid width\n" +
          "[2] - Grid height\n" +
          "[3] - Mines number\n" +
          "[4] - True/False for showing GUI\n"
          "Example: python solver.py 16 16 40 True\n\n")
    sys.exit()
else:
    width = int(sys.argv[1])
    height = int(sys.argv[2])
    n_mines = int(sys.argv[3])
    bool_gui = str(sys.argv[4])
    if bool_gui.lower() == "true":
        bool_show_gui = True
    else:
        bool_show_gui = False
print(sys.version)

"""
=====================================================================================
FUNCTIONS
=====================================================================================
"""


def write_grid(grid):
    """
    :param grid:
    :return: Write the values of the input matrix composed of Cell objects
    """

    h = len(grid)
    w = len(grid[0])
    # create empty squared Cell matrix
    grid_values = [[0 for y in range(w)] for x in range(h)]
    # write column indexes
    file.write("  | ")
    for j in range(w):
        file.write(str(j) + " ")
    file.write("\n")
    for i in range(h):
        for j in range(w):
            cell = grid[i][j]
            if cell.isKnown:
                if cell.isBomb:
                    grid_values[i][j] = 'B'
                elif cell.isNull:
                    grid_values[i][j] = 'X'
                else:
                    grid_values[i][j] = str(cell.value)
            else:
                grid_values[i][j] = '-'
            if j == 0:
                if i >= 10:
                    file.write(str(i) + "| " + str(grid_values[i][j]) + " ")
                else:
                    file.write(str(i) + " | " + str(grid_values[i][j]) + " ")
            elif j >= 10:
                file.write(str(" " + str(grid_values[i][j]) + " "))
            else:
                file.write(str(grid_values[i][j]) + " ")
        file.write("\n")
    file.write("\n\n")


def write_bombs(grid):
    """
    :param grid: matrix of Cell objects
    :return: Print the bomb values of the input matrix composed of Cell objects
    """

    file.write("BOMBS VALUES\n")
    h = len(grid)
    w = len(grid[0])
    # create empty squared Cell matrix
    grid_values = [[0 for y in range(w)] for x in range(h)]
    for i in range(h):
        for j in range(w):
            cell = grid[i][j]
            if cell.isKnown:
                if cell.isBomb:
                    grid_values[i][j] = 'B'
                elif cell.isNull:
                    grid_values[i][j] = 'X'
                else:
                    grid_values[i][j] = str(cell.bombs)
            else:
                grid_values[i][j] = '-'
            file.write(str(grid_values[i][j]) + " ")
        file.write("\n")
    file.write("\n\n")


def get_grid_bombs(grid):
    """
    :param grid:
    :return: list of cells which are bombs
    """
    bomb_cells = []
    h = len(grid)
    w = len(grid[0])
    for i in range(h):
        for j in range(w):
            if grid[i][j].isBomb:
                bomb_cell = (i, j)
                bomb_cells.append(bomb_cell)
    return bomb_cells


def get_unclicked_cells(grid):
    """
    :param grid:
    :return: list of cells which can be clicked. Used by random_clicker
    """
    unclicked_cells = []
    h = len(grid)
    w = len(grid[0])
    for i in range(h):
        for j in range(w):
            if not grid[i][j].isKnown:
                unclicked_cell = (i, j)
                unclicked_cells.append(unclicked_cell)
    return unclicked_cells


def get_adjacent_cells(cell, grid, diagonal):
    """
    This function computes adjacent cells taking into account grid borders
    :param cell: clicked cell
    :param grid: squared matrix of Cell objects
    :param diagonal: bool indicating if consider also "diagonal" cells. If diagonal=False we get only N,S,W,E
    :return: array of adjacent cells
    """

    # the following if statements could have been implemented with more efficiency and decreasing memory usage with less
    # variable declarations but I preferred to increase code readability and maintenance

    adjacent_cells = []
    h = len(grid)
    w = len(grid[0])

    # N cell
    n_x = cell.x - 1
    n_y = cell.y
    if n_x >= 0:
        adjacent_cells.append(grid[n_x][n_y])
    # S cell
    s_x = cell.x + 1
    s_y = cell.y
    if s_x < h:
        adjacent_cells.append(grid[s_x][s_y])
    # W cell
    w_x = cell.x
    w_y = cell.y - 1
    if w_y >= 0:
        adjacent_cells.append(grid[w_x][w_y])
    # E cell
    e_x = cell.x
    e_y = cell.y + 1
    if e_y < w:
        adjacent_cells.append(grid[e_x][e_y])

    if diagonal:
        # NW cell
        nw_x = cell.x - 1
        nw_y = cell.y - 1
        if (nw_x >= 0) & (nw_y >= 0):
            adjacent_cells.append(grid[nw_x][nw_y])
        # NE cell
        ne_x = cell.x - 1
        ne_y = cell.y + 1
        if (ne_x >= 0) & (ne_y < w):
            adjacent_cells.append(grid[ne_x][ne_y])
        # SE cell
        se_x = cell.x + 1
        se_y = cell.y + 1
        if (se_x < h) & (se_y < w):
            adjacent_cells.append(grid[se_x][se_y])
        # SW cell
        sw_x = cell.x + 1
        sw_y = cell.y - 1
        if (sw_x < h) & (sw_y >= 0):
            adjacent_cells.append(grid[sw_x][sw_y])

    return adjacent_cells


def get_free_adjacent_cells(cell, grid, diagonal):
    """
    :param cell:
    :param grid:
    :param diagonal: if False returns only cells N,W,S,E
    :return: return the unclicked cells surrounding <cell>
    """
    adjacent_cells = get_adjacent_cells(cell, grid, diagonal)
    free_adjacent_cells = []
    for c in adjacent_cells:
        if not c.isKnown:
            free_adjacent_cells.append(c)

    return free_adjacent_cells


def update_bomb_counter(cell, grid):
    """
    Get the adjacent cells of <cell> and updates its bomb counter.
    :param cell:
    :param grid:
    :return:
    """
    bomb_counter = 0
    adjacent = get_adjacent_cells(cell, grid, True)
    for adj in adjacent:
        if adj.isBomb:
            bomb_counter = bomb_counter + 1
    return bomb_counter


def is_null_expandable(cell, grid):
    """
    :param cell:
    :param grid:
    :return: boolean asserting if the null cell can be expanded or it's completely surrounded
    """
    expandable = False
    adjacent_cells = get_adjacent_cells(cell, grid, True)
    for a in adjacent_cells:
        if not a.isKnown:
            expandable = True
            break

    return expandable


def null_cell_procedure(cell, truth_grid, exploring_grid):
    """
    This function returns the surrounding cell of a null one
    :param cell: cell to expand
    :param truth_grid:
    :param exploring_grid:
    :return: a list of the adjacent cells  with respect to cell.
    """

    # get adjacent cells from truth_grid -> we cannot have unknown cells surrounding a null one
    adjacent_cells = get_adjacent_cells(cell, truth_grid, True)
    for adj in adjacent_cells:
        x = adj.x
        y = adj.y
        exploring_grid[x][y] = adj

    return adjacent_cells


def expand_cells_from_null(cell, truth_grid, exploring_grid):
    """
    This functions expands the cell surrounding a null one.
    :param cell: null cell from which the expansion start
    :param truth_grid: fully known grid
    :param exploring_grid: grid to explore
    :return:
    """

    to_expand = null_cell_procedure(cell, truth_grid, exploring_grid)
    cell_to_update = []

    if len(to_expand) > 0:
        cells_considered = [cell]
        # keep expanding null cells until we find cells with values
        expand = True
        while expand:
            with_value = []

            # don't consider for expansion cells with values but add them in cells_considered
            for i in range(0, len(to_expand)):
                if not to_expand[i].isNull:
                    # we save cells not null in with_value and in cells_considered -> no need to expand them
                    with_value.append(to_expand[i])
                    cells_considered.append(to_expand[i])
            # filter to_expand to keep only null cells (which need to be expanded)
            to_expand = [x for x in to_expand if x not in cells_considered]

            # select a cell and remove it from to_expand
            if len(to_expand) > 0:
                for i in range(0, len(to_expand)):
                    new_cell = to_expand[i]
                    to_expand.remove(to_expand[i])
                    break

                # add the null new_cell found in cells_considered and expand it
                cells_considered.append(new_cell)
                new_expansions = null_cell_procedure(new_cell, truth_grid, exploring_grid)
                # add new elements in expansion list while flattening
                for i in range(0, len(new_expansions)):
                    if new_expansions[i].isNull and new_expansions[i] not in cells_considered:
                        to_expand.append(new_expansions[i])
                    # if the cell is not null it has a value
                    elif not new_expansions[i].isNull:
                        with_value.append((new_expansions[i]))

                # in cell_to_update we store the cells with values resulting from expansion
                cell_to_update.append(with_value)

                # if we already considered all elements to expand we can exit the loop
                if all(elem in cells_considered for elem in to_expand):
                    expand = False

                    # update bomb values of newly found cells
                    flat_list = [item for sublist in cell_to_update for item in sublist]
                    cell_to_update = set(flat_list)
                    for cell in cell_to_update:
                        bomb_counter = update_bomb_counter(cell, exploring_grid)
                        cell.bombs = bomb_counter
                        file.write("Null_expansion_+: update Cell ("+str(cell.x) + "," + str(cell.y) + ") - bombs adjacent: " + str(bomb_counter) + "\n")
            else:
                expand = False
                # update cells
                for cell in with_value:
                    bomb_counter = update_bomb_counter(cell, exploring_grid)
                    cell.bombs = bomb_counter
                    file.write("Null_expansion_1: update Cell (" + str(cell.x) + "," + str(cell.y) + ") - bombs adjacent: " + str(bomb_counter) + "\n")


def bomb_finder(exploring_grid):
    """
    This functions finds the bomb considering single known cells
    :param exploring_grid:
    :return: a list of cells in which there is a bomb based on the information present in exploring grid
    """
    h = len(exploring_grid)
    w = len(exploring_grid[0])
    bomb_cells = []
    for i in range(h):
        for j in range(w):
            cell = exploring_grid[i][j]
            if cell.isKnown and cell.isBomb == False and cell.isNull == False:
                residual_value = abs(cell.value - cell.bombs)
                if residual_value > 0:
                    free_adjacent_cells = get_free_adjacent_cells(cell, exploring_grid, True)
                    if len(free_adjacent_cells) - residual_value == 0:
                        for free in free_adjacent_cells:
                            if free not in bomb_cells:
                                bomb_cells.append(free)

    return bomb_cells


def free_cell_finder(exploring_grid):
    """
    :param exploring_grid:
    :return: a list of cells which are free (= not bombs) and can be clicked
    """
    h = len(exploring_grid)
    w = len(exploring_grid[0])
    free_cells = []
    for i in range(h):
        for j in range(w):
            cell = exploring_grid[i][j]
            if cell.isKnown and cell.isBomb == False and cell.isNull == False:
                if cell.bombs - cell.value == 0:
                    temp = get_free_adjacent_cells(cell, exploring_grid, True)
                    free_cells.append(temp)
    flat_list = [item for sublist in free_cells for item in sublist]
    flat_list = set(flat_list)

    return flat_list


def get_unexplored_adjacent_cells(exploring_grid):
    """
    :param exploring_grid:
    :return: get cells suitable for 2-cell logic -> they need to be adjacent but NOT diagonally
    """
    h = len(exploring_grid)
    w = len(exploring_grid[0])
    unexplored_adjacent_cells = []

    for i in range(h):
        for j in range(w):
            c1 = exploring_grid[i][j]
            if c1.isKnown and c1.isNull == False and c1.isBomb == False:
                # get adjacent cells not considering diagonal
                adjacents = get_adjacent_cells(c1, exploring_grid, False)
                for a in adjacents:
                    if a.isKnown and a.isNull == False and a.isBomb == False:
                        pair = [c1, a]
                        swapped_pair = [a, c1]
                        # condition for not inserting "swap duplicates"  - ex: don't insert (b,a) in [(a,b), (b,c)]
                        if swapped_pair not in unexplored_adjacent_cells:
                            unexplored_adjacent_cells.append(pair)

    return unexplored_adjacent_cells


def two_cells_logic(c1, c2, exploring_grid):
    """
    This function should be used only on adjacent cells.
    :param c1: considered cell
    :param c2: cell located directly N,W,S or E with respect to c1
    :param exploring_grid:
    :return: if the conditions are met, it returns a new discovered cell which can be a bomb or a free cell to click
    """
    free_adjacent_c1 = get_free_adjacent_cells(c1, exploring_grid, True)
    free_adjacent_c2 = get_free_adjacent_cells(c2, exploring_grid, True)
    n_free_adjacent_c1 = len(free_adjacent_c1)
    n_free_adjacent_c2 = len(free_adjacent_c2)
    residual_value_c1 = abs(c1.value - c1.bombs)
    residual_value_c2 = abs(c2.value - c2.bombs)
    discovered_cell = None

    # first condition: one of the two cells must have only one adjacent bomb left
    # if n_free_adjacent_c1 == residual_value_c1 + 1 or n_free_adjacent_c2 == residual_value_c2 + 1:
    if (n_free_adjacent_c1 == residual_value_c1 + 1 and residual_value_c1 == 1) or (n_free_adjacent_c2 == residual_value_c2 + 1 and residual_value_c1 == 1):

        # second condition: there must be a difference of 1 cell between the two sets of free adjacent cells
        if abs(n_free_adjacent_c1-n_free_adjacent_c2) == 1:

            # get the cell which differs - there must be only one differing cell between them
            if n_free_adjacent_c1 > n_free_adjacent_c2:
                differing_cell = [x for x in free_adjacent_c1 if x not in free_adjacent_c2]
                cell = differing_cell[0]
            else:
                differing_cell = [x for x in free_adjacent_c2 if x not in free_adjacent_c1]
                cell = differing_cell[0]

            # the number of differing cells must be = 1
            if len(differing_cell) == 1:
                # if both cells have 1 adjacent bomb left, the differing cell is free
                if residual_value_c1 == 1 and residual_value_c2 == 1:
                    discovered_cell = Cell(cell.x, cell.y, cell.value, cell.bombs, True, False, False, cell.cell_id)

                # if both cells have 1+ adjacent bomb left, the differing cell is a bomb
                elif residual_value_c1 > 1 or residual_value_c2 > 1:
                    #discovered_cell = Cell(cell.x, cell.y, cell.value, 0, True, True, False, cell.cell_id)
                    discovered_cell = Cell(cell.x, cell.y, 'B', 0, True, True, False, cell.cell_id)

    return discovered_cell


def click_cell(x, y, truth_grid, exploring_grid):
    """
    Click the cell (x,y) and returns its value
    :param x:
    :param y:
    :param truth_grid:
    :param exploring_grid:
    :return:
    """
    # in truth_grid the bomb counter is initialized as 0
    clicked_cell = truth_grid[x][y]

    if clicked_cell.isBomb:
        file.write("\nKO cell: (" + str(x) + ", " + str(y) + ")\n")
        write_grid(exploring_grid)
        # sys.exit()
        return None

    elif clicked_cell.isNull:
        file.write(("Found null cell: (" + str(x) + "," + str(y) + ")\n"))
        print("Found null cell: (" + str(x) + "," + str(y) + ")\n")
        exploring_grid[x][y] = clicked_cell
        write_grid(exploring_grid)
        write_bombs(exploring_grid)
        if is_null_expandable(clicked_cell, exploring_grid):
            file.write("Cell expansion from (" + str(x) + "," + str(y) + ")\n")
            expand_cells_from_null(clicked_cell, truth_grid, exploring_grid)
            write_grid(exploring_grid)
            write_bombs(exploring_grid)
        return clicked_cell

    # get information about the cell from truth_grid and then update bomb counter
    else:
        file.write("Click cell: (" + str(x) + "," + str(y) + ")\n")
        print("Click cell: (" + str(x) + "," + str(y) + ")\n")
        # update bomb counter for clicked cell
        n_bombs = update_bomb_counter(clicked_cell, exploring_grid)
        clicked_cell.bombs = n_bombs
        exploring_grid[x][y] = clicked_cell
        write_grid(exploring_grid)
        write_bombs(exploring_grid)
        return clicked_cell


def deterministic_strategy(truth_grid, exploring_grid):
    """
    This function applies deterministic strategies on single cells: bomb_finder + free_cell_finder
    :param truth_grid:
    :param exploring_grid:
    :return:
    """
    search = True
    deterministic_iterations = 0
    file.write("Searching for deterministic cells...")

    while search:
        bombs = bomb_finder(exploring_grid)
        bombs = set(bombs)
        n_bombs = len(bombs)
        file.write("Trovate " + str(n_bombs) + " bombs --- Stampa dopo bomb finder\n")
        for b in bombs:
            file.write("Bomb: (" + str(b.x) + "," + str(b.y) + ")\n")
            print("Bomb: (" + str(b.x) + "," + str(b.y) + ")\n")
            x = b.x
            y = b.y
            b.isBomb = True
            b.isKnown = True
            b.value = 'B'
            exploring_grid[x][y] = b
            # step_description = "Found bomb -> (" + str(x) + "," + str(y) + ")"
            # show_gui_computation(exploring_grid, step_description)

            # update bomb counter for adjacent cells of bomb
            adj_cells = get_adjacent_cells(b, exploring_grid, True)
            for a in adj_cells:
                if a.isBomb == False and a.isNull == False:
                    a.bombs = a.bombs + 1
                file.write("Bomb (" + str(b.x) + "," + str(b.y) + ") - Updating adjacent cell (" + str(a.x) + "," + str(a.y) + ") -> bombs:" + str(a.bombs) + "\n")
        file.write("\nbombs values after setting bombs\n")
        write_bombs(exploring_grid)

        free_cells = free_cell_finder(exploring_grid)
        n_free = len(free_cells)
        file.write("Trovate " + str(n_free) + " free --- Stampa dopo free cells\n")
        for free in free_cells:
            file.write("Free cell: (" + str(free.x) + "," + str(free.y) + ")\n")
            print("Free cell: (" + str(free.x) + "," + str(free.y) + ")\n")
            x = free.x
            y = free.y
            click_cell(x, y, truth_grid, exploring_grid)
            # step_description = "Found free cell -> (" + str(x) + "," + str(y) + ")"
            # show_gui_computation(exploring_grid, step_description)
        file.write("\nbombs values after clicking free cells\n")
        write_bombs(exploring_grid)

        if n_bombs == 0 and n_free == 0:
            search = False
        else:
            deterministic_iterations = deterministic_iterations + 1

    return deterministic_iterations


def grid_completed(grid):
    h = len(grid)
    w = len(grid[0])
    completed = True

    for i in range(h):
        for j in range(w):
            if not grid[i][j].isKnown:
                completed = False
                break
    return completed


def complete_bombs(grid, n_mines):
    """
    This function looks if the missing cells are bombs, free, or deeper computations are needed
    :param grid:
    :param n_mines:
    :return:
    """
    grid_bomb_cells = get_grid_bombs(grid)
    grid_bomb_counter = len(grid_bomb_cells)
    grid_free_cells = get_unclicked_cells(grid)
    grid_free_counter = len(grid_free_cells)

    if n_mines - grid_bomb_counter == grid_free_counter:
        return "B", grid_bomb_cells
    elif n_mines - grid_bomb_counter == 0:
        return "F", grid_free_cells
    else:
        return None, None


def show_gui_computation(grid, step_description, bool_final=None):
    """
    This function shows the computation performed by the algorithm with a GUI
    :param grid:
    :param step_description:
    :param bool_final: if None updates the grid, else it stops and shows final grid (game solved/game over)
    :return:
    """
    if bool_show_gui:
        if bool_final is None:
            app.show_grid(grid, step_description)
            app.update()
            # time.sleep(refresh_frequency)
            app.clear_frame()
        else:
            app.show_grid(grid, step_description)
            app.update()
            time.sleep(sleep_gui_time)


"""
=====================================================================================
SOLVER
=====================================================================================
"""


def game_solver(truth_grid, exploring_grid):
    # TODO: complete logic --> BOMB COUNTER
    '''
    1. CLICK CELL
    2. BOMB FINDER:
        -- put bombs in those cells
        -- increase bomb counter of adjacent known cells
        -- increase global bomb counter
    3. FREE_CELL FINDER -> click those cells
    4a. reiterate 2) and 3)
    4b. if sizeBomb = 0 and sizeFreeCell = 0 -> RUN TWO_CELLS LOGIC
    5. in case no strategy is appliable, click random free cell
    '''

    random_click = True
    game_done = False
    game_over = False

    h = len(truth_grid)
    w = len(truth_grid[0])

    print("\n --- START GAME -- \n")
    while not game_done and not game_over:
        deterministic_iterations = 0
        n_two_cells_logic_pairs = 0

        if random_click:
            clickable_cell = False
            unclicked_cells = get_unclicked_cells(exploring_grid)

            while not clickable_cell:
                start_x = random.randrange(h)
                start_y = random.randrange(w)
                cell = (start_x, start_y)
                if cell in unclicked_cells:
                    print("Out of deterministic strategies -> RANDOM CLICK (" + str(start_x) + "," + str(start_y) + ")")
                    file.write(
                        "Out of deterministic strategies -> RANDOM CLICK (" + str(start_x) + "," + str(start_y) + ")\n")
                    clickable_cell = True
                    c = click_cell(start_x, start_y, truth_grid, exploring_grid)
                    if c is None:
                        exploring_grid[start_x][start_y].value = 'B'
                        file.write("GAME OVER")
                        print("GAME OVER")
                        game_over = True
                        break
                    else:
                        step_description = "No deterministic strategies: random click -> (" + str(start_x) + "," + str(start_y) + ")"
                        show_gui_computation(exploring_grid, step_description)

        else:
            # 1. use deterministic strategy
            deterministic_iterations = deterministic_strategy(truth_grid, exploring_grid)
            step_description = "Deterministic strategies applied"
            show_gui_computation(exploring_grid, step_description)
            # 2. find unexplored cell suitable for the two_cells_logic
            cell_pairs = get_unexplored_adjacent_cells(exploring_grid)
            # 3. apply two_cells_logic to those pairs
            for c in cell_pairs:
                discover = two_cells_logic(c[0], c[1], exploring_grid)
                if discover is not None:
                    n_two_cells_logic_pairs = n_two_cells_logic_pairs + 1
                    if not discover.isBomb:
                        file.write("2CL click: (" + str(discover.x) + ", " + str(discover.y) + ")\n")
                        print("2 CellLogic click: (" + str(discover.x) + ", " + str(discover.y) + ")\n")
                        click_cell(discover.x, discover.y, truth_grid, exploring_grid)
                        # step_description = "2CL: found free cell -> (" + str(discover.x) + "," + str(discover.y) + ")"
                        # show_gui_computation(exploring_grid, step_description)
                    else:
                        exploring_grid[discover.x][discover.y] = discover
                        file.write("2CL bomb (" + str(discover.x) + ", " + str(discover.y) + ")\n")
                        print("2 CellLogic bomb: (" + str(discover.x) + ", " + str(discover.y) + ")\n")
                        adj_cells = get_adjacent_cells(discover, exploring_grid, True)
                        for a in adj_cells:
                            if a.isBomb == False and a.isNull == False:
                                    a.bombs = a.bombs + 1
                        # step_description = "2CL: found bomb -> (" + str(discover.x) + "," + str(discover.y) + ")"
                        # show_gui_computation(exploring_grid, step_description)
            step_description = "Double cell logic applied"
            show_gui_computation(exploring_grid, step_description)

        if deterministic_iterations == 0 and n_two_cells_logic_pairs == 0:
            random_click = not random_click
        else:
            random_click = False
            game_done = grid_completed(exploring_grid)

    return exploring_grid, game_done


"""
=====================================================================================
BOARD GAME CREATOR
=====================================================================================
"""


def create_grid(w, h, n_bombs):
    # initialize empty grid
    grid = [[Cell(x, y, 0, 0, False, False, False, 0) for y in range(w)] for x in range(h)]
    bombs = []
    coord_dictionary = []
    bomb_counter = 0

    # set bombs
    while bomb_counter < n_bombs:
        x = random.randrange(h)
        y = random.randrange(w)
        coordinates = (x, y)
        cell_id = (x + 1) * h - (w - (y + 1))
        bomb = Cell(x, y, 'b', 0, True, True, False, cell_id)
        if coordinates not in coord_dictionary:
            bombs.append(bomb)
            coord_dictionary.append(coordinates)
            grid[x][y] = bomb
            bomb_counter = bomb_counter + 1

    file.write("CONFIGURE - settaggio bombe\n")
    write_grid(grid)
    file.write("Bombe messe: " + str(len(bombs)) + "\n")
    file.write("Bombe calcolate: " + str(len(set(coord_dictionary))) + "\n")

    # considering the bombs, set cell with values
    for b in bombs:
        # file.write("consider bomba (" + str(b.x) + "," + str(b.y) + "\n")
        adj_cells = get_adjacent_cells(b, grid, True)
        for a in adj_cells:
            if not a.isBomb:
                x = a.x
                y = a.y
                cell_id = (x + 1) * h - (w - (y + 1))
                value = a.value + 1
                grid[x][y] = Cell(x, y, value, 0, True, False, False, cell_id)
                # file.write("cell (" + str(x) + "," + str(y) + ") --- value: " + str(value) + "\n")
    file.write("CONFIGURE - settaggio values\n")
    write_grid(grid)

    # set null cells
    for i in range(h):
        for j in range(w):
            cell_id = (i + 1) * h - (w - (j + 1))
            cell = grid[i][j]
            if cell.value == 0 and cell.isBomb == False:
                grid[i][j] = Cell(i, j, 'x', 0, True, False, True, cell_id)
    file.write("CONFIGURE - settaggio null\n")
    write_grid(grid)

    return grid


"""
=====================================================================================
MAIN
=====================================================================================
"""


def main(grid_width, grid_height, mines_number):
    """
    EASY: 9x9 - 10
    MEDIUM: 16x16 - 40
    EXPERT: 30x16 - 99
    """

    # create empty squared Cell matrix
    exploring_grid = [[Cell(0, 0, 0, 0, False, False, False, 0) for y in range(grid_width)] for x in range(grid_height)]
    cell_id = 0
    for i in range(grid_width):
        for j in range(grid_height):
            cell_id = cell_id + 1
            exploring_grid[i][j].x = i
            exploring_grid[i][j].y = j
            exploring_grid[i][j].cell_id = cell_id
    truth_grid_2 = create_grid(grid_width, grid_height, mines_number)
    file.write("TRUTH\n")
    write_grid(truth_grid_2)

    # result is true if game is solved, false otherwise
    final_grid, result = game_solver(truth_grid_2, exploring_grid)
    if result:
        step_description = "BOARD SOLVED!"
        show_gui_computation(final_grid, step_description, True)
    else:
        step_description = "GAME OVER :("
        show_gui_computation(final_grid, step_description, True)


if __name__ == "__main__":
    try:
        start_time = time.time()
        main(width, height, n_mines)
        if bool_show_gui:
            print("Execution time: %s seconds ---" % (time.time() - start_time - sleep_gui_time))
            file.write("Execution time: %s seconds ---" % (time.time() - start_time - sleep_gui_time))
        else:
            print("Execution time: %s seconds ---" % (time.time() - start_time))
            file.write("Execution time: %s seconds ---" % (time.time() - start_time))
        file.close()

    except Exception as ex:
        print("Unexpected exception has occured: " + str(ex))
