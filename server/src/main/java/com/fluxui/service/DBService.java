package com.fluxui.service;

import javax.annotation.Resource;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Stateless
public class DBService {

  @Resource(name="postgresDS", mappedName="java:jboss/datasources/postgresDS")
  private DataSource dataSource;

  Connection connection = null;

  @TransactionAttribute(TransactionAttributeType.REQUIRED)
  public Connection usePostgresDS() throws SQLException {
    try {
      if(connection == null){
        connection = dataSource.getConnection("postgres","postgres");
      }
    } catch (Exception e) {
      // handle exceptions
      e.printStackTrace();
    } finally {
    }
    return connection;
  }

}
