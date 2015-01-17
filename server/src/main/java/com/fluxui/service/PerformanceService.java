package com.fluxui.service;


import com.fluxui.jms.PerfQueueManager;


import org.jboss.resteasy.annotations.GZIP;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import javax.validation.Validator;
import javax.ws.rs.*;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.logging.Logger;

@Path("/performance")
@RequestScoped
public class PerformanceService implements Serializable {

  @Inject
  PerfQueueManager perfQueueManager;

  @Inject
  private transient Logger log;

  @Inject
  private Validator validator;

  @Inject
  DBService postgresService;


  private static String OS = System.getProperty("os.name").toLowerCase();
  String LOCATION = "/root/jboss-as-7.1.1.Final-fluxui/";

  {
    if (OS.contains("mac")) {
      LOCATION = "/Users/wesleyhales/dev/speedgun/server/jboss-as-7.1.1.Final-fluxui/";
    }
  }

  private JsonObject readJSON(String data){
    JsonReader reader = Json.createReader(new StringReader(data));
    JsonObject myObject = reader.readObject();
    reader.close();
    return myObject;
  }

  @POST
  @Path("/reportData")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response reportData(String report) {
    System.out.println("-----------report: " + report);
    JsonObject object = readJSON(report);
    try {
      System.out.println("--go---");
      java.sql.Connection con = postgresService.usePostgresDS();
//			  String query = "UPDATE Test SET a=?, b=? WHERE KEY=?";
      String query = "INSERT INTO jsontest (data) VALUES (?::jsonb);";
      PreparedStatement statement = con.prepareStatement(query);

			  statement.setString(1, object.toString());
//			  statement.setLong(2, 1000);

      statement.executeUpdate();

      statement.close();
    } catch (SQLException e) {
      e.printStackTrace();
    }


    System.out.println("----------JSON-report: " + object.size());
    Response.ResponseBuilder builder = null;

    builder = Response.ok();

    return builder.build();
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

  @GZIP
  @GET
  @Path("/report")
  @Produces(MediaType.APPLICATION_JSON)
//  @NotNull(message="uuid cannot be null") @Pattern(regexp = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",message="uuid must be in proper format")
  public Response report(@QueryParam("uuid") String uuid) {
    //todo - check to see what this uuid position is and multiply timeout
    Response.ResponseBuilder builder = null;
    Map<String, String> responseObj = new HashMap<String, String>();
    //the following location string is dependent on where you start the server (from the actual directory the command is ran from).
//    builder = Response.ok();
    String all = "[";

    if(uuid == null || uuid == "null"){
      responseObj.put("error", "uuid cannot be null");
      builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
      return builder.build();
    }

    ResultSet rs = null;

    try {
      java.sql.Connection con = postgresService.usePostgresDS();
      String query = "SELECT * FROM jsontest WHERE data -> ? > '1'";
      PreparedStatement statement = con.prepareStatement(query);

      statement.setString(1, uuid);
//      statement.setString(2, uuid);

      rs = statement.executeQuery();

      try {

        while(rs.next()){
          all += rs.getString("data");
          if(!rs.isLast()){
            all += ",";
          }
        }

        all += "]";

      } catch (SQLException e) {
        e.printStackTrace();
      }

      statement.close();
    } catch (SQLException e) {
      e.printStackTrace();
    }

    builder = Response.status(Response.Status.OK).entity(all);
//    try {
//
//
//      BufferedReader in;
//      File locatedFile = new File(LOCATION + "reports/speedgun-" + uuid + ".json");
//
//      log.info("[Speedgun] Checking for file: " + LOCATION + "reports/speedgun-" + uuid + ".json");
//      log.info("[Speedgun] Located file? " + locatedFile.exists());
//
//        if (locatedFile.exists()) {
//          in = new BufferedReader(new FileReader(LOCATION + "reports/speedgun-" + uuid + ".json"));
//          String ln;
//
//          while ((ln = in.readLine()) != null)
//            all += ln;
//          in.close();
//
//          builder = Response.status(Response.Status.OK).entity(all);
//
//        } else {
//          responseObj.put("status","pending");
//          responseObj.put("position",PerfQueueManager.incomingMsgs + "");
//          builder = Response.status(Response.Status.OK).entity(responseObj);
//  //        return "{\"status\":\"pending\",\"position\":\"" + PerfQueueManager.incomingMsgs + "\"}";
//        }
//
////      }
//      //System.out.println(all);
//    } catch (ConstraintViolationException ce) {
//      //Handle bean validation issues
//      builder = createViolationResponse(ce.getConstraintViolations());
//    } catch (Exception e) {
//      // Handle generic exceptions
//      responseObj = new HashMap<String, String>();
//      responseObj.put("error", e.getMessage());
//      builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
//    }
    return builder.build();
  }



  private Response.ResponseBuilder createViolationResponse(Set<ConstraintViolation<?>> violations) {
    log.fine("Validation completed. violations found: " + violations.size());

    Map<String, String> responseObj = new HashMap<String, String>();

    for (ConstraintViolation<?> violation : violations) {
      responseObj.put(violation.getPropertyPath().toString(), violation.getMessage());
    }

    return Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
  }


}
