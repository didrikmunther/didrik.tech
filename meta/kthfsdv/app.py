#!./kthfsdv/bin/python3

import numpy as np
import matplotlib.pyplot as plt
import math

class LamdaPlot():
    x_label = 'x'
    y_label = 'y'
    h_coef = 3
    lam_coef = 5
    id = 1

    def __init__(self, id, h_coef = 3, lam_coef = 5):
        self.h_coef = h_coef
        self.lam_coef = lam_coef
        self.id = id

    def lam(self, t):
        return self.lam_coef * np.sin(2 * math.pi * t)

    def h(self, t):
        return self.h_coef * math.pi * np.exp(-self.lam(t))

    def plot(self):
        plt.subplot(2, 2, self.id)
        plt.title(self.x_label)
        plt.ylabel(self.y_label)

        x = np.linspace(-15,15,100)
        y = self.h(x)

        plt.plot(x,y)

def draw():
    plt.show()

def main():
    # Because of how this library uses subplots I would instead use a kind of manager for 
    #   drawing the plots, collecting every plot and calculating how to divide the subplot grid
    #   before plotting and drawing the plots

    plot1 = LamdaPlot(1, lam_coef=1)
    plot2 = LamdaPlot(2, h_coef=-50)
    plot3 = LamdaPlot(3, h_coef=500, lam_coef=20)

    plot1.plot()
    plot2.plot()
    plot3.plot()

    draw()

if __name__ == '__main__':
    main()