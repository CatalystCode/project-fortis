import React, { Component } from 'react';
import {Card, CardHeader, CardTitle, CardActions, CardMedia} from 'material-ui/Card';

import styles from '../../styles/Graphics/styles';
import '../../styles/Graphics/GraphCard.css';

export default class GraphCard extends Component {
  render() {
    return (
      <Card className='dash-card'>
        {
          this.props.cardHeader ?
            <CardHeader className='card-header' {...this.props.cardHeader}/> : undefined
        }
        <CardMedia style={styles.cardMediaStyle}>
            {this.props.children}
        </CardMedia>
        {
          this.props.cardTitle ? <CardTitle {...this.props.cardTitle}/> : undefined
        }
        {
         this.props.cardActions ?
            <CardActions>
                {this.props.cardActions}
            </CardActions> : undefined
        }
      </Card>
    );
  }
}