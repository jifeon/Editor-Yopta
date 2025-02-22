/* eslint-disable @next/next/no-img-element */
import { FC } from 'react';
import cx from 'classnames';
import { ReactEditor, useFocused, useSelected, useSlate } from 'slate-react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { v4 } from 'uuid';
import { MediaEditorLayout } from '../MediaEditorLayout';
import { ImageElement } from '../Editor/types';
import { ImageRender } from '../ImageRender/ImageRender';
import { uploadToCloudinary } from '../../utils';
import { Loader } from '../Loader';
import { MediaEditorOptions } from '../MediaEditorOptions';
import { ELEMENT_TYPES_MAP } from '../Editor/constants';
import s from './ImageEditor.module.scss';

const toBase64 = (file): Promise<string | ArrayBuffer | null> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

type Props = { element: ImageElement; className: string; attributes: any };

const ImageEditor: FC<Props> = ({ element, attributes, className, children }) => {
  const editor = useSlate();
  const selected = useSelected();
  const focused = useFocused();

  const onUpload = async (file: File) => {
    const dataSrc = await toBase64(file);

    const image: ImageElement & { isVoid: boolean } = {
      id: v4(),
      type: 'image',
      children: [{ text: '' }],
      'data-src': dataSrc,
      src: null,
      isVoid: true,
    };

    Transforms.removeNodes(editor);
    Transforms.insertNodes(editor, [image]);

    const { url } = await uploadToCloudinary(file);
    const newImage = {
      ...image,
      src: url,
      'data-src': null,
    };

    Transforms.removeNodes(editor);
    Transforms.insertNodes(editor, [newImage]);
  };

  const dataSrc = element['data-src'];

  const onDelete = () => {
    const path = ReactEditor.findPath(editor, element);
    Transforms.removeNodes(editor, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === ELEMENT_TYPES_MAP.image,
      at: path,
    });
  };

  if (dataSrc) {
    return (
      <div
        draggable={false}
        {...attributes}
        contentEditable={false}
        className={cx(className, { [s.selected]: selected && focused })}
      >
        <div className={s.loader}>
          <Loader />
        </div>
        <div contentEditable={false}>
          <ImageRender src={dataSrc} alt="loaded_image" />
        </div>
        {children}
      </div>
    );
  }

  if (element.src) {
    return (
      <div
        draggable={false}
        {...attributes}
        contentEditable={false}
        className={cx(className, { [s.selected]: selected && focused })}
      >
        <div className={s.options}>
          <MediaEditorOptions onDelete={onDelete} isImage />
        </div>
        <ImageRender src={element.src} alt="URI" />
        {children}
      </div>
    );
  }

  return (
    <div draggable={false} {...attributes} contentEditable={false} className={className}>
      <div className={s.options}>
        <MediaEditorOptions isImage onDelete={onDelete} />
      </div>
      <MediaEditorLayout mediaType="image" accept={{ 'image/*': [] }} onUpload={onUpload} />
      {children}
    </div>
  );
};

export { ImageEditor };
