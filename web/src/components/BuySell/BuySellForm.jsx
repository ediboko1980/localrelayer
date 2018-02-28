// @flow
import React from 'react';
import {
  reduxForm,
  Field,
} from 'redux-form';
import {
  Form,
} from 'antd';
import moment from 'moment';
import BigNumber from 'bignumber.js';

import type {
  Node,
  StatelessFunctionalComponent,
} from 'react';

import type {
  Token,
} from 'instex-core/types';

import {
  NumberInput,
  DateInput,
} from '../ReduxFormComponents';
import {
  PlaceOrderButton,
  LabelContainer,
  LabelListContainer,
  AdditionInfoContainer,
} from './styled';

const validate = (values, props) => {
  const errors = {};
  if (!values.amount || values.amount === 0) {
    errors.amount = 'Please enter amount';
  }
  if (!values.price || values.price === 0) {
    errors.price = 'Please enter price';
  }
  if (!values.exp) {
    errors.exp = 'Please enter expire date';
  }
  if (values.price && values.amount) {
    if (!/^-?\d+\.?\d*$/.test(values.price)) {
      errors.price = 'Please only numbers';
    }
    if (!/^-?\d+\.?\d*$/.test(values.amount)) {
      errors.amount = 'Please only numbers';
    }
    if (
      BigNumber(values.price)
        .times(values.amount)
        .lt(window.SMALLEST_AMOUNT)
    ) {
      errors.amount = 'Order is too small :(';
    }
    if (
      BigNumber(values.price)
        .times(values.amount)
        .gt(window.BIGGEST_AMOUNT)
    ) {
      errors.amount = "Order is too big, we can't process it :(";
    }
    if (props.type === 'sell' && BigNumber(values.amount).gt(props.currentToken.balance)) {
      errors.amount = "You don't have the required amount";
    }
    if (
      props.type === 'buy' &&
      BigNumber(values.price)
        .times(values.amount)
        .gt(props.currentPair.balance)
    ) {
      errors.amount = "You don't have the required amount";
    }
  }
  return errors;
};

type Props = {
  handleSubmit: () => void,
  currentToken: Token,
  currentPair: Token,
  type: string,
  fillField: (field: string, data: Object) => void,
  fee?: string,
  total?: string,
};

function disabledDate(current) {
  // Can not select days before today and today
  return current && current < moment().endOf('day');
}

/**
 * Buy/Sell form
 * @version 1.0.0
 * @author [Vladimir Pal](https://github.com/VladimirPal)
 */

const BuySellForm: StatelessFunctionalComponent<Props> = ({
  handleSubmit,
  currentToken,
  currentPair,
  type,
  fillField,
  fee,
  total,
}: Props): Node => (
  <Form layout="vertical" onSubmit={handleSubmit}>
    <Field
      id="price"
      type="text"
      name="price"
      label={
        <LabelContainer>
          <div>Price</div>
          <LabelListContainer>
            <a onClick={() => fillField('price', { orderType: 'buy' })}>Buy</a>
            <a onClick={() => fillField('price', { orderType: 'sell' })}>Sell</a>
          </LabelListContainer>
        </LabelContainer>
      }
      placeholder={currentPair.symbol}
      component={NumberInput}
    />
    <Field
      id="amount"
      type="text"
      name="amount"
      label={
        <LabelContainer>
          <div>Amount</div>
          <LabelListContainer>
            <a onClick={() => fillField('amount', { orderType: type, coef: '0.25' })}>25%</a>
            <a onClick={() => fillField('amount', { orderType: type, coef: '0.50' })}>50%</a>
            <a onClick={() => fillField('amount', { orderType: type, coef: '0.75' })}>75%</a>
            <a onClick={() => fillField('amount', { orderType: type, coef: '1' })}>100%</a>
          </LabelListContainer>
        </LabelContainer>
      }
      placeholder={currentToken.symbol}
      component={NumberInput}
    />
    <Field
      id="exp"
      type="text"
      name="exp"
      label={
        <LabelContainer>
          <div>Order expiration</div>
          <LabelListContainer>
            <a onClick={() => fillField('exp', { period: ['1', 'day'] })}>Day</a>
            <a onClick={() => fillField('exp', { period: ['7', 'days'] })}>Week</a>
            <a onClick={() => fillField('exp', { period: ['1', 'month'] })}>Month</a>
          </LabelListContainer>
        </LabelContainer>
      }
      showTime
      placeholder="Select time"
      dateFormat="DD/MM/YYYY HH:mm"
      disabledDate={disabledDate}
      component={DateInput}
    />
    <AdditionInfoContainer>
      <div><div>Total:</div><div>{total} {currentPair.symbol}</div></div>
      <div><div>Fee:</div><div>{fee} {type === 'sell' ? currentPair.symbol : currentToken.symbol}</div></div>
    </AdditionInfoContainer>
    <PlaceOrderButton size="large" type="primary" htmlType="submit">
      Place order
    </PlaceOrderButton>
  </Form>
);

BuySellForm.defaultProps = {
  fee: '0.000000',
  total: '0.000000',
};

export default reduxForm({
  form: 'BuySellForm',
  touchOnChange: true,
  enableReinitialize: true,
  validate,
})(BuySellForm);
