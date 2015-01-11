package com.fluxui.service;

/**
 * Created by wesleyhales on 12/14/14.
 */
public class SGStatus {

  private String id;
  private long timestamp;
  private String ip;

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

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public long getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(long timestamp) {
    this.timestamp = timestamp;
  }

  public String getIp() {
    return ip;
  }

  public void setIp(String ip) {
    this.ip = ip;
  }
}
