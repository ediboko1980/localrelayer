// @flow
import React from 'react';
import type { Node } from 'react';
import {
  Tooltip,
  Tag,
} from 'antd';
import type { Order } from 'instex-core/types';
import { Element } from 'react-scroll';
import moment from 'moment';

import { UserOrdersContainer } from './styled';
import { Colored } from '../SharedStyles';
import OrdersList from '../OrdersList';

type Props = {
  /** List of all orders */
  orders: Array<Order>,
  /** Table title */
  title: string,
};

const colorsByStatus = {
  canceled: 'magenta',
  completed: 'green',
  failed: 'red',
  pending: 'geekblue',
};

export const getColumns = (
) => [
  {
    title: 'Date',
    dataIndex: 'date',
    render: (text: string, order: Order) => {
      const field = order.status === 'canceled' ? 'canceled_at' : 'completed_at';
      return (
        <Tooltip title={moment(order[field]).format('llll')}>
          {moment(order[field]).format('DD/MM/YYYY HH:mm')}
        </Tooltip>
      );
    },
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (text: string, record: Order) => (
      <Colored color={record.type === 'sell' ? 'red' : 'green'}>{text}</Colored>
    ),
  },
  {
    title: 'Pair',
    render: (text: string, order: Order) => `${order.tokenSymbol}/${order.pairSymbol}`,
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: 'Total',
    dataIndex: 'total',
    key: 'total',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (text: string) => (
      <Tag color={colorsByStatus[text]}>{text}</Tag>
    ),
  },
];

/**
 * User orders history
 * @version 1.0.0
 * @author [Tim Reznich](https://github.com/imbaniac)
 */

const UserHistory = ({
  orders,
  title,
}: Props): Node => (
  <Element name="userOrders">
    <UserOrdersContainer>
      <OrdersList
        title={title}
        columns={getColumns()}
        data={orders}
      />
    </UserOrdersContainer>
  </Element>
);

export default UserHistory;