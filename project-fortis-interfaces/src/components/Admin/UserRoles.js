import React from 'react';
import Snackbar from 'material-ui/Snackbar';
import groupBy from 'lodash/groupBy';
import differenceBy from 'lodash/differenceBy';
import { DataGrid } from './DataGrid';
import { getColumns } from './shared';
const { Editors, Formatters } = require('react-data-grid-addons');
const { DropDownEditor } = Editors;
const { DropDownFormatter } = Formatters;

const roles = ['user', 'admin'];

class UserRoles extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      message: ''
    };
  }

  componentDidMount = () => {
    this.props.flux.actions.ADMIN.load_users()
  }

  getUserRolesColumns = () => {
    const columnValues = [
      {editable: true, filterable: true, sortable: true, key: "identifier", name: "Identity"},
      {editable: false, filterable: true, sortable: true, key: "role", name: "Role", editor: <DropDownEditor options={roles}/>, formatter: <DropDownFormatter options={roles}/>}
    ];

    return getColumns(columnValues);
  }

  handleSave = users => {
    const adminRowsMissingUserRole = this.getAllAdminWithoutUserRole(users);
    if (adminRowsMissingUserRole.length > 0) this.alertAddUserOnAddAdmin(adminRowsMissingUserRole);
    this.props.flux.actions.ADMIN.add_users(this.removeIdsFromUsers(users));
  }

  getAllAdminWithoutUserRole = users => {
    const usersGroupedByRole = groupBy(users, 'role');
    return differenceBy(usersGroupedByRole.admin, usersGroupedByRole.user, 'identifier');
  }

  alertAddUserOnAddAdmin = admin => {
    const adminIdentities = admin.map(a => a.identifier);
    this.setState({
      open: true,
      message: `Added user role to ${adminIdentities}.`
    });
  }

  removeIdsFromUsers = users => {
    return users.map(user => ({identifier: user.identifier, role: user.role}) );
  }

  handleRemove = users => {
    this.props.flux.actions.ADMIN.remove_users(this.removeIdsFromUsers(users), (err, res) => {
      if (!err) {
        const usersMissingAdminRole = this.getAllUsersWithoutAdminRole(users);
        if (usersMissingAdminRole.length > 0) this.alertDeleteAdminOnDeleteUser(usersMissingAdminRole);
      }
    });
  }

  getAllUsersWithoutAdminRole = users => {
    const usersGroupedByRole = groupBy(users, 'role');
    return differenceBy(usersGroupedByRole.user, usersGroupedByRole.admin, 'identifier');
  }

  alertDeleteAdminOnDeleteUser = users => {
    const adminIdentities = users.map(a => a.identifier);
    this.setState({
      open: true,
      message: `Admin roles for ${adminIdentities} were deleted for any user deletions.`
    });
  }

  render() {
    return (
      this.getUserRolesColumns().length <= 0 ?
        <div /> :
        <div>
          <DataGrid
            rowHeight={40}
            minHeight={500}
            rowKey="id"
            guidAutofillColumn="id"
            handleSave={this.handleSave}
            handleRemove={this.handleRemove}
            columns={this.getUserRolesColumns()}
            rows={this.props.users}/>
          <Snackbar
            open={this.state.open}
            message={this.state.message}
            autoHideDuration={5000}
            onRequestClose={this.handleRequestClose}
          />
        </div>
    );
  }
}

export default UserRoles;