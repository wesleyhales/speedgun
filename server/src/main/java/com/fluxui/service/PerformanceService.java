package com.fluxui.service;


import com.fluxui.jms.PerfQueueManager;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.ws.rs.*;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.*;
import java.util.logging.Logger;

@Path("/performance")
@RequestScoped
public class PerformanceService implements Serializable {

  @Inject
  PerfQueueManager perfQueueManager;

  @Inject
  private transient Logger log;


  private static String OS = System.getProperty("os.name").toLowerCase();
  String LOCATION = "/root/jboss-as-7.1.1.Final-fluxui/";

  {
    if (OS.contains("mac")) {
      LOCATION = "/Users/wesleyhales/dev/speedgun/server/jboss-as-7.1.1.Final-fluxui/";
    }
  }


  @GET
  @Path("/go")
  @Produces("text/html")
  public String go(@QueryParam("url") String url, @QueryParam("cached") String cached, @QueryParam("email") String email) {
    String retVal = "";
    String response = "{}";
    String taskName = "performance";
    int position = 0;
    UUID random = UUID.randomUUID();

    //if(incomingMsgs > 0){
    boolean keepgoing = false;
    try {
      URL urltemp = new URL(url);
      URLConnection conn = urltemp.openConnection();
      conn.connect();
      keepgoing = true;
    } catch (MalformedURLException e) {
      // the URL is not in a valid form
      keepgoing = false;
      response = "{\"status\":\"failed\"}";

    } catch (IOException e) {
      // the connection couldn't be established
      keepgoing = false;
      response = "{\"status\":\"failed\"}";
    }

    if (keepgoing) {

//            HashMap<String,String> tempMap = new HashMap<String,String>();
//            tempMap.put("url",url);
//            tempMap.put("uuid",random.toString());

      if (cached.equals("true")) {
        taskName = "performancecache";
        //tempMap.put("taskName",taskName);
      }

      position = perfQueueManager.storeMessage(url, taskName, random.toString(), email);
    } else {
      System.out.println("Bad URL");
      return response;
    }

    try {
      retVal = "{\"position\":" + position + ",\"uuid\":\"" + random.toString() + "\",\"email\":\"" + (email.isEmpty() ? "false" : "true") + "\"}";
    } catch (Exception e) {
      retVal = response;
    }

    return retVal;


  }


  @GET
  @Path("/report")
  @Produces(MediaType.APPLICATION_JSON)
  public String report(@QueryParam("uuid") String uuid) {
    //todo - check to see what this uuid position is and multiply timeout
    Response.ResponseBuilder builder = null;
    //the following location string is dependent on where you start the server (from the actual directory the command is ran from).
    builder = Response.ok();
    String all = "";
    try {
      BufferedReader in;
      File locatedFile = new File(LOCATION + "reports/speedgun-" + uuid + ".json");

      log.info("[Speedgun] Checking for file: " + LOCATION + "reports/speedgun-" + uuid + ".json");
      log.info("[Speedgun] Located file? " + locatedFile.exists());
      if (locatedFile.exists()) {
        in = new BufferedReader(new FileReader(LOCATION + "reports/speedgun-" + uuid + ".json"));
      } else {
        return "{\"status\":\"pending\"}";
      }

      String ln;

      while ((ln = in.readLine()) != null)
        all += ln;
      in.close();
      //System.out.println(all);
    } catch (FileNotFoundException e) {
      e.printStackTrace();
    } catch (IOException e) {
      e.printStackTrace();
    }
    return all;
  }

  @GET
  @Path("/speedreport")
  @Produces(MediaType.TEXT_HTML)
  public String speedreport(@QueryParam("uuid") String uuid) {
    //todo - check to see what this uuid position is and multiply timeout
    Response.ResponseBuilder builder = null;
    //the following location string is dependent on where you start the server (from the actual directory the command is ran from).
    builder = Response.ok();
    String all = "";

    try {
      BufferedReader in;
      File locatedFile = new File(LOCATION + "speedreports/" + uuid + ".html");
      if (locatedFile.exists()) {
        in = new BufferedReader(new FileReader(LOCATION + "speedreports/" + uuid + ".html"));
      } else {
        return "{\"status\":\"pending\"}";
      }

      String ln;

      while ((ln = in.readLine()) != null)
        all += ln + "\n";
      in.close();
      //System.out.println(all);
    } catch (FileNotFoundException e) {
      e.printStackTrace();
    } catch (IOException e) {
      e.printStackTrace();
    }
    return all;
  }

  @GET
  @Path("/js")
  @Produces(MediaType.TEXT_HTML)
  public String speedreportjs(@QueryParam("uuid") String uuid) {
    //todo - check to see what this uuid position is and multiply timeout
    Response.ResponseBuilder builder = null;
    //the following location string is dependent on where you start the server (from the actual directory the command is ran from).
    builder = Response.ok();
    String all = "";
    StringBuilder ln = new StringBuilder();
    try {
      BufferedReader in;
      File locatedFile = new File(LOCATION + "speedreports/" + uuid + ".js");
      if (locatedFile.exists()) {
        in = new BufferedReader(new FileReader(LOCATION + "speedreports/" + uuid + ".js"));
      } else {
        return "{\"status\":\"failed\"}";
      }


      String tempString;
      while ((tempString = in.readLine()) != null)
        ln.append(tempString);
      in.close();
    } catch (FileNotFoundException e) {
      e.printStackTrace();
    } catch (IOException e) {
      e.printStackTrace();
    }
    return ln.toString();
  }


}
