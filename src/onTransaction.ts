/* eslint-disable prefer-template */
import { OnTransactionHandler } from '@metamask/snaps-types';
import { text } from '@metamask/snaps-ui';

import { apiClient } from './apiClient';
import { gql } from './gql';
import { storage } from './storage';
import { IAuthData } from './types';
import { SNAP_HOME } from './env';

export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  const authData = await storage.get('auth');
  if (authData) {
    return showLabelsForTx(transaction, authData);
  }

  return showAuthPrompt();
};

async function showLabelsForTx(transaction: any, authData: IAuthData) {
  const { from, to, data } = await getLabelsForTx(transaction);

  let contentText = ``;

  contentText += `_**From**_ (${shortAddr((transaction as any).from)}): `;
  if (from.length === 0) {
    contentText += `_No labels_\n\n`;
  } else if (from.length === 1) {
    const node = from[0];
    contentText += `**${node.label}** _(${node.orgName} Team)_\n\n`;
  } else {
    contentText += `\n`;
    from.forEach((node: any) => {
      contentText += `🔸**${node.label}** _(${node.orgName} Team)_\n`;
    });
    contentText += `\n`;
  }

  contentText += `_**To**_ (${shortAddr((transaction as any).to)}): `;
  if (to.length === 0) {
    contentText += `_No labels_\n\n`;
  } else if (to.length === 1) {
    const node = to[0];
    contentText += `**${node.label}** _(${node.orgName} Team)_\n\n`;
  } else {
    contentText += `\n`;
    to.forEach((node: any) => {
      contentText += `🔹**${node.label}** _(${node.orgName} Team)_\n`;
    });
    contentText += `\n`;
  }

  contentText += `_**Data:**_ `;
  if (data.length === 0) {
    contentText += `_No labels_\n\n`;
  } else if (data.length === 1) {
    const node = data[0];
    contentText += `${shortAddr(node.hash)} - **${node.label}** _(${
      node.orgName
    } Team)_`;
  } else {
    contentText += `\n`;
    const groups = groupBy(data, 'hash');

    Object.keys(groups).forEach((key: string) => {
      const group = groups[key];
      if (group.length === 1) {
        const node = group[0];
        contentText += `🔹${shortAddr(node.hash)} - **${node.label}** _(${
          node.orgName
        } Team)_\n`;
      } else {
        contentText += `🔹${shortAddr(group[0].hash)}:\n`;
        group.forEach((node: any) => {
          contentText += `  🔸**${node.label}** _(${node.orgName} Team)_\n`;
        });
      }
    });

    to.forEach((node: any) => {
      contentText += `🔸${shortAddr(node.hash)} - **${node.label}** _(${
        node.orgName
      } Team)_\n`;
    });
  }

  // contentText += `\n\n\n_Depending on the transaction type, the **To** address shown by Metamask might appear in the **Data** field presented above (e.g. ERC-20 transfers)._`;

  contentText += `\n\n➖➖➖`;
  contentText += `\n\n_Connected as **${authData.email}**_`;

  return {
    content: text(contentText),
  };
}

async function getLabelsForTx(tx: any) {
  const { data } = await apiClient.query({
    operationName: 'GetLabelsForTx',
    query: gql`
      query GetLabelsForTx($tx: String!) {
        labelsForTx(tx: $tx) {
          from {
            hash
            label
            orgName
          }
          to {
            hash
            label
            orgName
          }
          data {
            hash
            label
            orgName
          }
        }
      }
    `,
    variables: {
      tx: JSON.stringify(tx),
    },
  });

  return data.labelsForTx;
}

function shortAddr(addr: string) {
  return addr.slice(0, 5) + '...' + addr.slice(-4);
}

function groupBy(arr: any[], key: string) {
  const groups: {
    [key: string]: any[];
  } = {};

  arr.forEach((item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
  });

  return groups;
}

async function showAuthPrompt() {
  const contentText = `You are not connected to 0xTeabag.\n\nGo to **${SNAP_HOME}** and connect your 0xTeabag account.`;

  return {
    content: text(contentText),
  };
}
