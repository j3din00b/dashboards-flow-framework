/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { Field, FieldProps, getIn, useFormikContext } from 'formik';
import { isEmpty } from 'lodash';
import {
  EuiCodeEditor,
  EuiCompressedFormRow,
  EuiLink,
  EuiText,
} from '@elastic/eui';
import {
  customStringifySingleLine,
  WorkflowFormValues,
} from '../../../../../common';
import { camelCaseToTitleString } from '../../../../utils';

interface JsonLinesFieldProps {
  fieldPath: string; // the full path in string-form to the field (e.g., 'ingest.enrich.processors.text_embedding_processor.inputField')
  validate?: boolean;
  label?: string;
  helpLink?: string;
  helpText?: string | ReactNode;
  editorHeight?: string;
  readOnly?: boolean;
}

// The total number of visible errors to be shown at the bottom
const NUM_VISIBLE_ERRORS = 3;

/**
 * An input field for a component where users input data in JSON Lines format.
 * https://jsonlines.org/
 */
export function JsonLinesField(props: JsonLinesFieldProps) {
  const validate = props.validate ?? true;

  const { errors, touched, values } = useFormikContext<WorkflowFormValues>();

  // temp input state. only format when users click out of the code editor
  const [jsonStr, setJsonStr] = useState<string>('{}');
  const [customErrMsg, setCustomErrMsg] = useState<string | undefined>(
    undefined
  );

  // initializing the text to be the stringified form value
  useEffect(() => {
    if (props.fieldPath && values) {
      const formValue = getIn(values, props.fieldPath) as string;
      if (formValue) {
        setJsonStr(formValue);
      }
    }
  }, [props.fieldPath, values]);

  return (
    <Field name={props.fieldPath}>
      {({ field, form }: FieldProps) => {
        return (
          <EuiCompressedFormRow
            fullWidth={true}
            key={props.fieldPath}
            label={props.label || camelCaseToTitleString(field.name)}
            labelAppend={
              props.helpLink ? (
                <EuiText size="xs">
                  <EuiLink href={props.helpLink} target="_blank">
                    Learn more
                  </EuiLink>
                </EuiText>
              ) : undefined
            }
            helpText={props.helpText || undefined}
            error={
              validate ? (
                <>
                  {customErrMsg?.split('\n')?.map((errMsg, idx) => {
                    return (
                      <EuiText
                        key={idx}
                        color="danger"
                        size="xs"
                        style={{ marginBottom: '-8px' }}
                      >
                        {errMsg}
                      </EuiText>
                    );
                  })}
                </>
              ) : undefined
            }
            isInvalid={
              validate
                ? getIn(errors, field.name) && getIn(touched, field.name)
                : false
            }
          >
            <EuiCodeEditor
              mode="hjson"
              theme="textmate"
              width="100%"
              height={props.editorHeight || '15vh'}
              value={jsonStr}
              // Validate on every keystroke, collecting all of the errors
              onChange={(input) => {
                setJsonStr(input);
                form.setFieldTouched(field.name);
                form.setFieldValue(field.name, input);
                const errs = getErrs(input);
                if (errs?.length > 0) {
                  setCustomErrMsg(getFormattedErrorMsgList(errs));
                } else {
                  setCustomErrMsg(undefined);
                }
              }}
              // Format on blur. If formatting was successful, and there was no errors, then update the form.
              onBlur={() => {
                const finalJsonStr = getFormattedJsonStr(jsonStr);
                if (!isEmpty(finalJsonStr) && isEmpty(getErrs(jsonStr))) {
                  form.setFieldValue(field.name, finalJsonStr);
                }
              }}
              readOnly={props.readOnly || false}
              setOptions={{
                fontSize: '14px',
                useWorker: false,
                highlightActiveLine: !props.readOnly,
                highlightSelectedWord: !props.readOnly,
                highlightGutterLine: !props.readOnly,
                wrap: false,
              }}
              aria-label="Code Editor"
            />
          </EuiCompressedFormRow>
        );
      }}
    </Field>
  );
}

// Parse out the useful information from an error triggered during JSON parsing failure
function getFormattedErrorMsg(error: Error, idx: number): string {
  return `Error on line ${idx}: ${getIn(error, 'message', 'Invalid JSON')
    .replace(/^(.*?)\s+in JSON.*/, '$1')
    .replace(/^(.*?)\s+after JSON.*/, '$1')}`;
}

// Verbosely display a few error messages, list the count of remaining ones.
function getFormattedErrorMsgList(errors: string[]): string {
  let finalMsg = '';
  const verboseErrors = errors.slice(0, NUM_VISIBLE_ERRORS);
  const nonVerboseErrorCount = errors.length - NUM_VISIBLE_ERRORS;
  verboseErrors.forEach((error) => {
    finalMsg += error + '\n';
  });
  if (nonVerboseErrorCount > 0) {
    finalMsg += `${nonVerboseErrorCount} more error${
      nonVerboseErrorCount > 1 ? 's' : ''
    }`;
  } else if (finalMsg !== '') {
    // remove trailing newline
    finalMsg = finalMsg.slice(0, -1);
  }
  return finalMsg;
}

function getFormattedJsonStr(jsonStr: string): string {
  let finalJsonStr = '';
  try {
    const lines = jsonStr?.split('\n');
    lines.forEach((line: string, idx) => {
      if (line.trim() !== '') {
        let parsedLine = {};
        try {
          parsedLine = JSON.parse(line);
        } catch (error) {}
        if (!isEmpty(parsedLine)) {
          finalJsonStr += customStringifySingleLine(JSON.parse(line)) + '\n';
        }
      }
    });
    // remove trailing newline
    if (finalJsonStr !== '') {
      finalJsonStr = finalJsonStr.slice(0, -1);
    }
  } catch (error) {}
  return finalJsonStr;
}

function getErrs(jsonStr: string): string[] {
  let errs = [] as string[];
  try {
    const lines = jsonStr?.split('\n');
    lines.forEach((line: string, idx) => {
      if (line.trim() !== '') {
        let parsedLine = {};
        try {
          parsedLine = JSON.parse(line);
        } catch (error) {
          errs.push(getFormattedErrorMsg(error as Error, idx + 1));
        }
      }
    });
  } catch {}
  return errs;
}
