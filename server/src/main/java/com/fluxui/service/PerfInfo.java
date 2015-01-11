package com.fluxui.service;

/**
 * Created by wesleyhales on 12/14/14.
 */
public class PerfInfo {

  private int availableCores;
  private long freeMemory;
  private long maxMemory;
  private long totalMemory;
  private long totalSpace;
  private long freeSpace;
  private long usableSpace;

  public int getAvailableCores() {
    return availableCores;
  }

  public void setAvailableCores(int availableCores) {
    this.availableCores = availableCores;
  }

  public long getFreeMemory() {
    return freeMemory;
  }

  public void setFreeMemory(long freeMemory) {
    this.freeMemory = freeMemory;
  }

  public long getMaxMemory() {
    return maxMemory;
  }

  public void setMaxMemory(long maxMemory) {
    this.maxMemory = maxMemory;
  }

  public long getTotalMemory() {
    return totalMemory;
  }

  public void setTotalMemory(long totalMemory) {
    this.totalMemory = totalMemory;
  }

  public long getTotalSpace() {
    return totalSpace;
  }

  public void setTotalSpace(long totalSpace) {
    this.totalSpace = totalSpace;
  }

  public long getFreeSpace() {
    return freeSpace;
  }

  public void setFreeSpace(long freeSpace) {
    this.freeSpace = freeSpace;
  }

  public long getUsableSpace() {
    return usableSpace;
  }

  public void setUsableSpace(long usableSpace) {
    this.usableSpace = usableSpace;
  }

}
