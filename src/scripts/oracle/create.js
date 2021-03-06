function create(user, callback) {
  const bcrypt = require('bcrypt');
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OBJECT;

  oracledb.getConnection({
      user: configuration.dbUser,
      password: configuration.dbUserPassword,
      connectString: 'CONNECTION_STRING' // Refer here https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
    },
    function(err, connection) {
      if (err) return callback(err);

      const selectQuery = 'select ID, EMAIL, PASSWORD, EMAIL_VERIFIED, NICKNAME from Users where EMAIL = :email';
      connection.execute(selectQuery, [user.email], function(err, result) {
        if (err || result.rows.length > 0) {
          doRelease(connection);
          return callback(err || new Error('User already exists'));
        }
        bcrypt.hash(user.password, 10, function(err, hash) {
          if (err) return callback(err);

          user.password = hash;
          const insertQuery = 'insert into Users (EMAIL, PASSWORD, EMAIL_VERIFIED, NICKNAME) values (:email, :password, :email_verified, :nickname)';
          const params = [user.email, user.password, 'false', user.email.substring(0, user.email.indexOf('@'))];
          connection.execute(insertQuery, params, { autoCommit: true }, function(err) {
            doRelease(connection);
            callback(err);
          });
        });

      });

      // Note: connections should always be released when not needed
      function doRelease(connection) {
        connection.close(
          function(err) {
            if (err) console.error(err.message);
          });
      }
    });
}
